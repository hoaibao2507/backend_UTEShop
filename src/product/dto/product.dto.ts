import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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

// DTO cho các API trang chủ
export class HomepageProductQueryDto {
    @ApiProperty({ 
        description: 'Số lượng sản phẩm mới nhất cần lấy', 
        example: 8, 
        required: false,
        type: 'number'
    })
    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    latestLimit?: number;

    @ApiProperty({ 
        description: 'Số lượng sản phẩm bán chạy cần lấy', 
        example: 6, 
        required: false,
        type: 'number'
    })
    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    bestSellingLimit?: number;

    @ApiProperty({ 
        description: 'Số lượng sản phẩm được xem nhiều cần lấy', 
        example: 8, 
        required: false,
        type: 'number'
    })
    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    mostViewedLimit?: number;

    @ApiProperty({ 
        description: 'Số lượng sản phẩm khuyến mãi cần lấy', 
        example: 4, 
        required: false,
        type: 'number'
    })
    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    topDiscountLimit?: number;
}

export class LatestProductsQueryDto {
    @ApiProperty({ 
        description: 'Số lượng sản phẩm mới nhất cần lấy', 
        example: 10, 
        required: false,
        type: 'number'
    })
    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    limit?: number;
}

export class BestSellingProductsQueryDto {
    @ApiProperty({ 
        description: 'Số lượng sản phẩm bán chạy cần lấy', 
        example: 10, 
        required: false,
        type: 'number'
    })
    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    limit?: number;
}

export class MostViewedProductsQueryDto {
    @ApiProperty({ 
        description: 'Số lượng sản phẩm được xem nhiều cần lấy', 
        example: 10, 
        required: false,
        type: 'number'
    })
    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    limit?: number;
}

export class TopDiscountProductsQueryDto {
    @ApiProperty({ 
        description: 'Số lượng sản phẩm khuyến mãi cần lấy', 
        example: 10, 
        required: false,
        type: 'number'
    })
    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    limit?: number;
}

export class CreateProductWithImagesDto {
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
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

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    primaryImageIndex?: number;
}

export class UpdateProductWithImagesDto {
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
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

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    primaryImageIndex?: number;

    @IsString()
    @IsOptional()
    hasNewImages?: string; // 'true' or 'false'

    @IsString()
    @IsOptional()
    existingImageIds?: string; // Comma-separated IDs

    @IsString()
    @IsOptional()
    remainingImageIds?: string; // Comma-separated IDs

    @IsString()
    @IsOptional()
    keepExistingImages?: string; // 'true' or 'false'
}