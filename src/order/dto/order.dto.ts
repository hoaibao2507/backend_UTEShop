import { IsNumber, IsPositive, IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../entities/order.entity';

export class CreateOrderDto {
    @IsNumber()
    @IsPositive()
    userId: number;

    @IsNumber()
    @IsPositive()
    @Type(() => Number)
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
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;

    @IsOptional()
    @Type(() => Number)
    userId?: number;

    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsOptional()
    @IsString()
    sortBy?: string = 'orderDate';

    @IsOptional()
    @IsString()
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
