import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../../entities/order.entity';

export class UpdateOrderTrackingDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsString()
  @IsOptional()
  note?: string;
}
