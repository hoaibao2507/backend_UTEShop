import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
import { NotificationTemplate, NotificationTemplateType } from '../entities/notification-template.entity';
import { UserNotificationPreferences } from '../entities/user-notification-preferences.entity';
import { CreateNotificationDto, GetNotificationsDto, BulkCreateNotificationDto } from './dto/notification.dto';
import { WebSocketService } from '../websocket/websocket.service';

export interface NotificationResponse {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  orderId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsListResponse {
  notifications: NotificationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

export interface GetNotificationsOptions {
  page?: number;
  limit?: number;
  filter?: 'all' | 'unread' | 'read';
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationTemplate)
    private templateRepository: Repository<NotificationTemplate>,
    @InjectRepository(UserNotificationPreferences)
    private preferencesRepository: Repository<UserNotificationPreferences>,
    private webSocketService: WebSocketService,
  ) {}

  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    // Check user notification preferences
    const preferences = await this.preferencesRepository.findOne({
      where: { userId: data.userId },
    });

    if (preferences) {
      // Check if user wants this type of notification
      const shouldNotify = this.shouldNotifyUser(preferences, data.type);
      if (!shouldNotify) {
        throw new BadRequestException('User has disabled this type of notification');
      }
    }

    const notification = this.notificationRepository.create(data);
    const savedNotification = await this.notificationRepository.save(notification);
    
    // Emit WebSocket event
    this.webSocketService.emitNotificationCreated(data.userId, this.mapToResponse(savedNotification));
    
    return savedNotification;
  }

  async getUserNotifications(
    userId: number,
    options: GetNotificationsOptions = {},
  ): Promise<NotificationsListResponse> {
    const { page = 1, limit = 10, filter = 'all' } = options;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Notification> = { userId };

    if (filter === 'read') {
      where.isRead = true;
    } else if (filter === 'unread') {
      where.isRead = false;
    }

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const unreadCount = await this.getUnreadCount(userId);

    return {
      notifications: notifications.map(this.mapToResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.update(notificationId, { isRead: true });
    
    // Emit WebSocket event
    this.webSocketService.emitNotificationRead(userId, notificationId);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async deleteNotification(notificationId: number, userId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.delete(notificationId);
  }

  async getUnreadCount(userId: number): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async createOrderStatusNotification(
    orderId: number,
    status: string,
    userId: number,
  ): Promise<void> {
    const template = await this.getTemplate(NotificationTemplateType.ORDER_STATUS_UPDATE);
    
    const notification = this.notificationRepository.create({
      userId,
      type: NotificationType.INFO,
      title: template.titleTemplate.replace('{orderId}', orderId.toString()),
      message: template.messageTemplate.replace('{status}', status),
      orderId,
      actionUrl: `/orders/${orderId}`,
    });

    const savedNotification = await this.notificationRepository.save(notification);
    
    // Emit WebSocket event
    this.webSocketService.emitNotificationCreated(userId, this.mapToResponse(savedNotification));
  }

  async createPaymentSuccessNotification(
    orderId: number,
    userId: number,
  ): Promise<void> {
    const template = await this.getTemplate(NotificationTemplateType.PAYMENT_SUCCESS);
    
    const notification = this.notificationRepository.create({
      userId,
      type: NotificationType.SUCCESS,
      title: template.titleTemplate,
      message: template.messageTemplate.replace('{orderId}', orderId.toString()),
      orderId,
      actionUrl: `/orders/${orderId}`,
    });

    const savedNotification = await this.notificationRepository.save(notification);
    
    // Emit WebSocket event
    this.webSocketService.emitNotificationCreated(userId, this.mapToResponse(savedNotification));
  }

  async createProductLowStockNotification(
    productId: number,
    productName: string,
    userId: number,
  ): Promise<void> {
    const template = await this.getTemplate(NotificationTemplateType.PRODUCT_LOW_STOCK);
    
    const notification = this.notificationRepository.create({
      userId,
      type: NotificationType.WARNING,
      title: template.titleTemplate,
      message: template.messageTemplate.replace('{productName}', productName),
      actionUrl: `/products/${productId}`,
    });

    const savedNotification = await this.notificationRepository.save(notification);
    
    // Emit WebSocket event
    this.webSocketService.emitNotificationCreated(userId, this.mapToResponse(savedNotification));
  }

  async bulkCreateNotifications(data: BulkCreateNotificationDto): Promise<void> {
    const notifications = data.userIds.map(userId => 
      this.notificationRepository.create({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
      })
    );

    const savedNotifications = await this.notificationRepository.save(notifications);
    
    // Emit WebSocket events for each notification
    savedNotifications.forEach(notification => {
      this.webSocketService.emitNotificationCreated(notification.userId, this.mapToResponse(notification));
    });
  }

  private async getTemplate(type: NotificationTemplateType): Promise<NotificationTemplate> {
    let template = await this.templateRepository.findOne({
      where: { type, isActive: true },
    });

    if (!template) {
      // Create default template if not exists
      template = await this.createDefaultTemplate(type);
    }

    return template;
  }

  private async createDefaultTemplate(type: NotificationTemplateType): Promise<NotificationTemplate> {
    const defaultTemplates = {
      [NotificationTemplateType.ORDER_STATUS_UPDATE]: {
        titleTemplate: 'Cập nhật đơn hàng #{orderId}',
        messageTemplate: 'Đơn hàng của bạn đã được cập nhật trạng thái: {status}',
      },
      [NotificationTemplateType.PAYMENT_SUCCESS]: {
        titleTemplate: 'Thanh toán thành công',
        messageTemplate: 'Thanh toán cho đơn hàng #{orderId} đã thành công',
      },
      [NotificationTemplateType.PRODUCT_LOW_STOCK]: {
        titleTemplate: 'Sản phẩm sắp hết hàng',
        messageTemplate: 'Sản phẩm {productName} trong wishlist sắp hết hàng',
      },
      [NotificationTemplateType.PROMOTION]: {
        titleTemplate: 'Khuyến mãi mới',
        messageTemplate: 'Có khuyến mãi mới dành cho bạn!',
      },
    };

    const templateData = defaultTemplates[type];
    const template = this.templateRepository.create({
      type,
      ...templateData,
    });

    return await this.templateRepository.save(template);
  }

  private shouldNotifyUser(preferences: UserNotificationPreferences, type: NotificationType): boolean {
    switch (type) {
      case NotificationType.INFO:
        return preferences.orderUpdates;
      case NotificationType.SUCCESS:
        return preferences.paymentNotifications;
      case NotificationType.WARNING:
        return preferences.productAlerts;
      case NotificationType.ERROR:
        return true; // Always notify errors
      default:
        return true;
    }
  }

  private mapToResponse(notification: Notification): NotificationResponse {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      actionUrl: notification.actionUrl,
      orderId: notification.orderId,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
    };
  }
}
