import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../../entities/order-status.enum';

export class UpdateOrderTrackingDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsString()
  @IsOptional()
  note?: string;
}
