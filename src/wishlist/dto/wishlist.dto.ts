import { IsNumber, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWishlistDto {
  @ApiProperty({ description: 'ID của sản phẩm', example: 1 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  productId: number;

  @ApiProperty({ description: 'ID của người dùng', example: 1 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  userId: number;
}

export class WishlistQueryDto {
  @ApiProperty({ description: 'Số trang', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @ApiProperty({ description: 'Số lượng mỗi trang', example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  limit: number = 10;

  @ApiProperty({ description: 'ID của người dùng', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  userId?: number;

  @ApiProperty({ description: 'ID của sản phẩm', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  productId?: number;
}
