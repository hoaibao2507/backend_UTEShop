import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
    @IsNumber()
    @IsPositive()
    categoryId: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    productName: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    price: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    @Type(() => Number)
    @IsOptional()
    discountPercent?: number;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    stockQuantity?: number;
}

export class UpdateProductDto {
    @IsNumber()
    @IsPositive()
    @IsOptional()
    categoryId?: number;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    productName?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    @IsOptional()
    price?: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    @Type(() => Number)
    @IsOptional()
    discountPercent?: number;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    stockQuantity?: number;
}

export class ProductQueryDto {
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;

    @IsOptional()
    @Type(() => Number)
    categoryId?: number;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Type(() => Number)
    minPrice?: number;

    @IsOptional()
    @Type(() => Number)
    maxPrice?: number;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsString()
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
