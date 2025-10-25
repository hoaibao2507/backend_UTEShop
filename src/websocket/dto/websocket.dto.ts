import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export class OrderStatusUpdateDto {
  @ApiProperty({ description: 'Order ID' })
  @IsNumber()
  orderId: number;

  @ApiProperty({ description: 'New order status', enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ description: 'Update message', required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ description: 'Updated by user ID' })
  @IsNumber()
  updatedBy: number;

  @ApiProperty({ description: 'Updated by username' })
  @IsString()
  updatedByUsername: string;
}

export class NotificationDto {
  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Notification type', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Target user ID', required: false })
  @IsOptional()
  @IsNumber()
  targetUserId?: number;

  @ApiProperty({ description: 'Target user type', required: false })
  @IsOptional()
  @IsString()
  targetUserType?: string;
}

export class RoomJoinDto {
  @ApiProperty({ description: 'Room name to join' })
  @IsString()
  room: string;
}

export class TestMessageDto {
  @ApiProperty({ description: 'Test message content' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Target user ID for user-specific test', required: false })
  @IsOptional()
  @IsNumber()
  targetUserId?: number;
}

