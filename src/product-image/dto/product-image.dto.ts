import { IsNumber, IsPositive, IsString, IsNotEmpty, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateProductImageDto {
    @IsNumber()
    @IsPositive()
    productId: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    imageUrl: string;

    @IsBoolean()
    @IsOptional()
    isPrimary?: boolean;
}

export class UpdateProductImageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    @IsOptional()
    imageUrl?: string;

    @IsBoolean()
    @IsOptional()
    isPrimary?: boolean;
}
