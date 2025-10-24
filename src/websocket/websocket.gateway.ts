import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebSocketService } from './websocket.service';
import type { AuthenticatedSocket } from './websocket.service';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger, UnauthorizedException, OnModuleInit } from '@nestjs/common';

@Injectable()
@WSGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);

  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly jwtService: JwtService,
  ) {}

  onModuleInit() {
    // Set server reference
    this.webSocketService.setServer(this.server);
    
    // Start cleanup interval - cleanup stale connections every 5 minutes
    setInterval(() => {
      this.webSocketService.cleanupStaleConnections(30); // 30 minutes timeout
      this.webSocketService.cleanupRateLimitEntries(); // Cleanup rate limit entries
      const stats = this.webSocketService.getConnectionStats();
      this.logger.log(`📊 Connection stats: ${stats.total} total, ${stats.staleConnections} stale`);
    }, 5 * 60 * 1000); // 5 minutes

    this.logger.log('🚀 WebSocket Gateway initialized with cleanup interval');
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`🔌 Client attempting to connect: ${client.id}`);

      // Rate limiting check
      if (!this.webSocketService.checkRateLimit(client.id, 5, 60000)) {
        this.logger.warn(`🚫 Rate limit exceeded for client: ${client.id}`);
        client.emit('error', { message: 'Too many connection attempts. Please wait before reconnecting.' });
        client.disconnect();
        return;
      }

      // Lấy token từ query hoặc headers
      const token = client.handshake.query.token as string || 
                   client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`❌ No token provided for client: ${client.id}`);
        client.emit('error', { message: 'Authentication token required' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });

      // Attach user info to socket
      const authenticatedSocket = client as AuthenticatedSocket;
      authenticatedSocket.userId = payload.sub || payload.userId;
      authenticatedSocket.userType = payload.type || 'customer';
      authenticatedSocket.username = payload.username || payload.email;

      // Increment connection attempts if reconnecting
      const existingClient = this.webSocketService.getClient(client.id);
      if (existingClient) {
        authenticatedSocket.connectionAttempts = (existingClient.connectionAttempts || 0) + 1;
      }

      // Store connection
      this.webSocketService.addClient(client.id, authenticatedSocket);

      // Join user-specific room
      client.join(`user_${authenticatedSocket.userId}`);
      
      // Join role-specific room
      client.join(`${authenticatedSocket.userType}s`);
      
      // Join specific role rooms based on user type
      if (authenticatedSocket.userType === 'customer') {
        client.join(`customer_${authenticatedSocket.userId}`);
      } else if (authenticatedSocket.userType === 'staff') {
        client.join(`staff_${authenticatedSocket.userId}`);
        client.join('all_staff');
      } else if (authenticatedSocket.userType === 'vendor') {
        client.join(`vendor_${authenticatedSocket.userId}`);
      } else if (authenticatedSocket.userType === 'admin') {
        client.join('all_admin');
      }

      // Send welcome message
      client.emit('connected', {
        message: 'Connected successfully',
        userId: authenticatedSocket.userId,
        userType: authenticatedSocket.userType,
        username: authenticatedSocket.username,
        connectionId: client.id,
      });

      this.logger.log(`✅ Client authenticated: ${client.id} (${authenticatedSocket.userType})`);

    } catch (error) {
      this.logger.error(`❌ Authentication failed for client: ${client.id}`, error.message);
      client.emit('error', { message: 'Invalid authentication token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Client disconnected: ${client.id}`);
    this.webSocketService.removeClient(client.id);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    if (data.room) {
      this.webSocketService.joinRoom(client.id, data.room);
      client.emit('joined_room', { room: data.room });
    }
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    if (data.room) {
      this.webSocketService.leaveRoom(client.id, data.room);
      client.emit('left_room', { room: data.room });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() client: AuthenticatedSocket) {
    // Update last seen timestamp
    this.webSocketService.updateLastSeen(client.id);
    client.emit('heartbeat_ack', { timestamp: new Date().toISOString() });
  }

  @SubscribeMessage('get_connection_info')
  handleGetConnectionInfo(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('connection_info', {
      clientId: client.id,
      userId: client.userId,
      userType: client.userType,
      username: client.username,
      connectedClients: this.webSocketService.getConnectedClientsCount(),
    });
  }

  // Order-related events
  @SubscribeMessage('subscribe_order_updates')
  handleSubscribeOrderUpdates(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: number },
  ) {
    if (data.orderId) {
      client.join(`order_${data.orderId}`);
      client.emit('subscribed_order', { orderId: data.orderId });
      this.logger.log(`📦 Client ${client.id} subscribed to order ${data.orderId}`);
    }
  }

  @SubscribeMessage('unsubscribe_order_updates')
  handleUnsubscribeOrderUpdates(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: number },
  ) {
    if (data.orderId) {
      client.leave(`order_${data.orderId}`);
      client.emit('unsubscribed_order', { orderId: data.orderId });
      this.logger.log(`📦 Client ${client.id} unsubscribed from order ${data.orderId}`);
    }
  }

  // Test endpoints for development
  @SubscribeMessage('test_broadcast')
  handleTestBroadcast(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { message: string },
  ) {
    this.webSocketService.broadcastToAll('test_message', {
      from: client.username,
      message: data.message,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('test_user_broadcast')
  handleTestUserBroadcast(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { targetUserId: number; message: string },
  ) {
    this.webSocketService.broadcastToUser(data.targetUserId, 'test_user_message', {
      from: client.username,
      message: data.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Notification-specific event handlers
  @SubscribeMessage('join_notification_room')
  handleJoinNotificationRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { userId: number },
  ) {
    if (data.userId && data.userId === client.userId) {
      client.join(`user_${data.userId}`);
      client.emit('joined_notification_room', { userId: data.userId });
      this.logger.log(`🔔 Client ${client.id} joined notification room for user ${data.userId}`);
    }
  }

  @SubscribeMessage('notification_read')
  handleNotificationRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: number },
  ) {
    if (data.notificationId && client.userId) {
      // Emit to user's notification room
      this.webSocketService.emitNotificationRead(client.userId, data.notificationId);
      client.emit('notification_read_ack', { notificationId: data.notificationId });
    }
  }

  @SubscribeMessage('get_notification_count')
  handleGetNotificationCount(@ConnectedSocket() client: AuthenticatedSocket) {
    // This would typically fetch from database, but for now just emit a placeholder
    client.emit('notification_count', { 
      unreadCount: 0, // This should be fetched from NotificationService
      timestamp: new Date().toISOString(),
    });
  }
}
