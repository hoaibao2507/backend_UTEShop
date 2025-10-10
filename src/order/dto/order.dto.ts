import { 
  IsNumber, 
  IsPositive, 
  IsEnum, 
  IsOptional, 
  IsString, 
  IsNotEmpty,
  IsArray,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../entities/order-status.enum';
import { PaymentMethod, PaymentStatus } from '../../entities/order.entity';

export class ShippingInfoDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  ward: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class SelectedItemDto {
  @IsNumber()
  @IsPositive()
  cartItemId: number;

  @IsNumber()
  @IsPositive()
  productId: number;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  price: number;
}

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  userId: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  cartId: number;

  @ValidateNested()
  @Type(() => ShippingInfoDto)
  shippingInfo: ShippingInfoDto;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  paymentMethodId: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalAmount: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedItemDto)
  selectedItems: SelectedItemDto[];
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

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @IsString()
  @IsOptional()
  notes?: string;
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
