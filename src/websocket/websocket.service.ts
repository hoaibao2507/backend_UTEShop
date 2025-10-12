import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  userId?: number;
  userType?: 'customer' | 'staff' | 'admin' | 'vendor';
  username?: string;
  lastSeen?: Date;
  connectionAttempts?: number;
}

@Injectable()
export class WebSocketService {
  private server: Server;
  private connectedClients = new Map<string, AuthenticatedSocket>();
  private connectionAttempts = new Map<string, { count: number; lastAttempt: Date }>();

  setServer(server: Server) {
    this.server = server;
  }

  // Lưu trữ kết nối
  addClient(clientId: string, socket: AuthenticatedSocket) {
    socket.lastSeen = new Date();
    socket.connectionAttempts = 1;
    this.connectedClients.set(clientId, socket);
    console.log(`🔌 Client connected: ${clientId} (${socket.userType})`);
  }

  // Xóa kết nối
  removeClient(clientId: string) {
    const socket = this.connectedClients.get(clientId);
    if (socket) {
      console.log(`🔌 Client disconnected: ${clientId} (${socket.userType})`);
      this.connectedClients.delete(clientId);
    }
  }

  // Lấy socket theo ID
  getClient(clientId: string): AuthenticatedSocket | undefined {
    return this.connectedClients.get(clientId);
  }

  // Lấy tất cả clients
  getAllClients(): Map<string, AuthenticatedSocket> {
    return this.connectedClients;
  }

  // Broadcast đến tất cả clients
  broadcastToAll(event: string, data: any) {
    if (this.server) {
      this.server.emit(event, data);
      console.log(`📢 Broadcast to all: ${event}`, data);
    }
  }

  // Broadcast đến user cụ thể
  broadcastToUser(userId: number, event: string, data: any) {
    const client = Array.from(this.connectedClients.values()).find(
      socket => socket.userId === userId
    );
    
    if (client) {
      client.emit(event, data);
      console.log(`📢 Broadcast to user ${userId}: ${event}`, data);
    }
  }

  // Broadcast đến users theo type
  broadcastToUserType(userType: string, event: string, data: any) {
    const clients = Array.from(this.connectedClients.values()).filter(
      socket => socket.userType === userType
    );
    
    clients.forEach(client => {
      client.emit(event, data);
    });
    
    console.log(`📢 Broadcast to ${userType}s: ${event}`, data);
  }

  // Broadcast đến room cụ thể
  broadcastToRoom(room: string, event: string, data: any) {
    if (this.server) {
      this.server.to(room).emit(event, data);
      console.log(`📢 Broadcast to room ${room}: ${event}`, data);
    }
  }

  // Thêm client vào room
  joinRoom(clientId: string, room: string) {
    const socket = this.connectedClients.get(clientId);
    if (socket) {
      socket.join(room);
      console.log(`🏠 Client ${clientId} joined room: ${room}`);
    }
  }

  // Xóa client khỏi room
  leaveRoom(clientId: string, room: string) {
    const socket = this.connectedClients.get(clientId);
    if (socket) {
      socket.leave(room);
      console.log(`🏠 Client ${clientId} left room: ${room}`);
    }
  }

  // Lấy số lượng clients đang kết nối
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Lấy danh sách clients theo type
  getClientsByType(userType: string): AuthenticatedSocket[] {
    return Array.from(this.connectedClients.values()).filter(
      socket => socket.userType === userType
    );
  }

  // Cập nhật thời gian last seen
  updateLastSeen(clientId: string) {
    const socket = this.connectedClients.get(clientId);
    if (socket) {
      socket.lastSeen = new Date();
    }
  }

  // Kiểm tra và cleanup các kết nối timeout
  cleanupStaleConnections(timeoutMinutes: number = 30) {
    const now = new Date();
    const timeoutMs = timeoutMinutes * 60 * 1000;
    
    for (const [clientId, socket] of this.connectedClients.entries()) {
      if (socket.lastSeen && (now.getTime() - socket.lastSeen.getTime()) > timeoutMs) {
        console.log(`🧹 Cleaning up stale connection: ${clientId}`);
        socket.disconnect();
        this.connectedClients.delete(clientId);
      }
    }
  }

  // Lấy thông tin chi tiết về kết nối
  getConnectionStats() {
    const stats = {
      total: this.connectedClients.size,
      byType: {} as Record<string, number>,
      staleConnections: 0,
    };

    const now = new Date();
    const timeoutMs = 30 * 60 * 1000; // 30 minutes

    for (const socket of this.connectedClients.values()) {
      const userType = socket.userType || 'unknown';
      stats.byType[userType] = (stats.byType[userType] || 0) + 1;
      
      if (socket.lastSeen && (now.getTime() - socket.lastSeen.getTime()) > timeoutMs) {
        stats.staleConnections++;
      }
    }

    return stats;
  }

  // Rate limiting functions
  checkRateLimit(clientId: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = new Date();
    const attempts = this.connectionAttempts.get(clientId);

    if (!attempts) {
      this.connectionAttempts.set(clientId, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset if window has passed
    if (now.getTime() - attempts.lastAttempt.getTime() > windowMs) {
      this.connectionAttempts.set(clientId, { count: 1, lastAttempt: now });
      return true;
    }

    // Check if under limit
    if (attempts.count < maxAttempts) {
      attempts.count++;
      attempts.lastAttempt = now;
      return true;
    }

    return false;
  }

  // Cleanup old rate limit entries
  cleanupRateLimitEntries() {
    const now = new Date();
    const windowMs = 60000; // 1 minute

    for (const [clientId, attempts] of this.connectionAttempts.entries()) {
      if (now.getTime() - attempts.lastAttempt.getTime() > windowMs) {
        this.connectionAttempts.delete(clientId);
      }
    }
  }
}

