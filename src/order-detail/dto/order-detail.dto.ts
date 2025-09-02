import { IsNumber, IsPositive, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDetailDto {
    @IsNumber()
    @IsPositive()
    orderId: number;

    @IsNumber()
    @IsPositive()
    productId: number;

    @IsNumber()
    @Min(1)
    @Type(() => Number)
    quantity: number;

    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    unitPrice: number;
}

export class UpdateOrderDetailDto {
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    quantity?: number;

    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    @IsOptional()
    unitPrice?: number;
}
