import { IsNumber, IsPositive, IsString, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductReviewDto {
    @IsNumber()
    @IsPositive()
    productId: number;

    @IsNumber()
    @IsPositive()
    userId: number;

    @IsNumber()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    rating: number;

    @IsString()
    @IsOptional()
    comment?: string;
}

export class UpdateProductReviewDto {
    @IsNumber()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    @IsOptional()
    rating?: number;

    @IsString()
    @IsOptional()
    comment?: string;
}

export class ProductReviewQueryDto {
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;

    @IsOptional()
    @Type(() => Number)
    productId?: number;

    @IsOptional()
    @Type(() => Number)
    userId?: number;

    @IsOptional()
    @Type(() => Number)
    rating?: number;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsString()
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
