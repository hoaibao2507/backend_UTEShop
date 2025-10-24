import { IsEnum, IsString, IsOptional, IsNumber, IsBoolean, IsUrl } from 'class-validator';
import { NotificationType } from '../../entities/notification.entity';

export class CreateNotificationDto {
  @IsNumber()
  userId: number;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsUrl()
  actionUrl?: string;

  @IsOptional()
  @IsNumber()
  orderId?: number;
}

export class GetNotificationsDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  filter?: 'all' | 'unread' | 'read' = 'all';
}

export class MarkAsReadDto {
  @IsNumber()
  notificationId: number;
}

export class BulkCreateNotificationDto {
  @IsNumber({}, { each: true })
  userIds: number[];

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsUrl()
  actionUrl?: string;
}
