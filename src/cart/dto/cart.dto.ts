import { IsNumber, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCartDto {
    @IsNumber()
    @IsPositive()
    userId: number;
}

export class UpdateCartDto {
    @IsNumber()
    @IsPositive()
    @IsOptional()
    userId?: number;
}
