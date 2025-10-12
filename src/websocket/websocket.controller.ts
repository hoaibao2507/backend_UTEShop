import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WebSocketService } from './websocket.service';
import { OrderStatusUpdateDto, NotificationDto, TestMessageDto } from './dto/websocket.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('websocket')
@Controller('websocket')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class WebSocketController {
  constructor(private readonly webSocketService: WebSocketService) {}

  @Post('broadcast-order-update')
  @ApiOperation({ 
    summary: 'Broadcast order status update',
    description: 'Send order status update to all connected clients'
  })
  @ApiResponse({ status: 200, description: 'Order update broadcasted successfully' })
  async broadcastOrderUpdate(@Body() orderUpdate: OrderStatusUpdateDto) {
    // Broadcast to order-specific room
    this.webSocketService.broadcastToRoom(
      `order_${orderUpdate.orderId}`,
      'order_status_update',
      {
        orderId: orderUpdate.orderId,
        status: orderUpdate.status,
        message: orderUpdate.message,
        updatedBy: orderUpdate.updatedBy,
        updatedByUsername: orderUpdate.updatedByUsername,
        timestamp: new Date().toISOString(),
      }
    );

    // Broadcast to staff/admin users
    this.webSocketService.broadcastToUserType('staff', 'order_status_update', {
      orderId: orderUpdate.orderId,
      status: orderUpdate.status,
      message: orderUpdate.message,
      updatedBy: orderUpdate.updatedBy,
      updatedByUsername: orderUpdate.updatedByUsername,
      timestamp: new Date().toISOString(),
    });

    this.webSocketService.broadcastToUserType('admin', 'order_status_update', {
      orderId: orderUpdate.orderId,
      status: orderUpdate.status,
      message: orderUpdate.message,
      updatedBy: orderUpdate.updatedBy,
      updatedByUsername: orderUpdate.updatedByUsername,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Order update broadcasted successfully',
      orderId: orderUpdate.orderId,
      status: orderUpdate.status,
    };
  }

  @Post('send-notification')
  @ApiOperation({ 
    summary: 'Send notification to users',
    description: 'Send notification to specific users or user types'
  })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendNotification(@Body() notification: NotificationDto) {
    if (notification.targetUserId) {
      // Send to specific user
      this.webSocketService.broadcastToUser(notification.targetUserId, 'notification', {
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        timestamp: new Date().toISOString(),
      });
    } else if (notification.targetUserType) {
      // Send to user type
      this.webSocketService.broadcastToUserType(notification.targetUserType, 'notification', {
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        timestamp: new Date().toISOString(),
      });
    } else {
      // Broadcast to all
      this.webSocketService.broadcastToAll('notification', {
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: true,
      message: 'Notification sent successfully',
      notification: {
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
      },
    };
  }

  @Post('test-broadcast')
  @ApiOperation({ 
    summary: 'Test broadcast message',
    description: 'Send test message to all connected clients'
  })
  @ApiResponse({ status: 200, description: 'Test message broadcasted successfully' })
  async testBroadcast(@Body() testMessage: TestMessageDto, @Request() req) {
    this.webSocketService.broadcastToAll('test_message', {
      from: req.user.username || req.user.email,
      message: testMessage.message,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Test message broadcasted successfully',
      data: {
        from: req.user.username || req.user.email,
        message: testMessage.message,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('test-user-message')
  @ApiOperation({ 
    summary: 'Test user-specific message',
    description: 'Send test message to specific user'
  })
  @ApiResponse({ status: 200, description: 'Test message sent successfully' })
  async testUserMessage(@Body() testMessage: TestMessageDto, @Request() req) {
    if (!testMessage.targetUserId) {
      return {
        success: false,
        message: 'targetUserId is required',
      };
    }

    this.webSocketService.broadcastToUser(testMessage.targetUserId, 'test_user_message', {
      from: req.user.username || req.user.email,
      message: testMessage.message,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Test message sent successfully',
      data: {
        from: req.user.username || req.user.email,
        targetUserId: testMessage.targetUserId,
        message: testMessage.message,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('connection-stats')
  @ApiOperation({ 
    summary: 'Get connection statistics',
    description: 'Get current WebSocket connection statistics'
  })
  @ApiResponse({ status: 200, description: 'Connection statistics retrieved successfully' })
  async getConnectionStats() {
    const totalConnections = this.webSocketService.getConnectedClientsCount();
    const customers = this.webSocketService.getClientsByType('customer').length;
    const staff = this.webSocketService.getClientsByType('staff').length;
    const admins = this.webSocketService.getClientsByType('admin').length;
    const vendors = this.webSocketService.getClientsByType('vendor').length;

    return {
      success: true,
      stats: {
        totalConnections,
        byType: {
          customers,
          staff,
          admins,
          vendors,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }
}

