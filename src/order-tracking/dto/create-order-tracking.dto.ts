import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../entities/order.entity';

export class CreateOrderTrackingDto {
  @IsNumber()
  @Type(() => Number)
  orderId: number;

  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsString()
  @IsOptional()
  note?: string;
}
