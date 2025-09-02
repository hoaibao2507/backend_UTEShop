import { IsNumber, IsOptional, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCartItemDto {
    @IsNumber()
    @IsPositive()
    cartId: number;

    @IsNumber()
    @IsPositive()
    productId: number;

    @IsNumber()
    @Min(1)
    @Type(() => Number)
    quantity: number;
}

export class UpdateCartItemDto {
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    quantity?: number;
}
