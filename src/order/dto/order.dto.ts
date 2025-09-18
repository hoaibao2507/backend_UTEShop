import { 
  IsNumber, 
  IsPositive, 
  IsEnum, 
  IsOptional, 
  IsString, 
  IsNotEmpty 
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../entities/order-status.enum';

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  userId: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsNotEmpty()
  totalAmount: number;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;
}

export class UpdateOrderDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  totalAmount?: number;
}

export class OrderQueryDto {
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit: number = 10;

  @IsOptional()
  @Type(() => Number)
  userId?: number;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  sortBy: string = 'orderDate';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder: 'ASC' | 'DESC' = 'DESC';
}
