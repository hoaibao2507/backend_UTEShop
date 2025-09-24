import { IsString, IsOptional, IsBoolean, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
  @ApiProperty({ description: 'Tên phương thức thanh toán', example: 'MOMO' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tên hiển thị', example: 'Ví MoMo' })
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ description: 'Mô tả phương thức thanh toán' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Cấu hình cho gateway', type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Thứ tự sắp xếp', default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({ description: 'Tên phương thức thanh toán' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Tên hiển thị' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Mô tả phương thức thanh toán' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Cấu hình cho gateway' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Thứ tự sắp xếp' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class PaymentMethodResponseDto {
  @ApiProperty({ description: 'ID phương thức thanh toán' })
  id: number;

  @ApiProperty({ description: 'Tên phương thức thanh toán' })
  name: string;

  @ApiProperty({ description: 'Tên hiển thị' })
  displayName: string;

  @ApiProperty({ description: 'Mô tả' })
  description: string;

  @ApiProperty({ description: 'Trạng thái hoạt động' })
  isActive: boolean;

  @ApiProperty({ description: 'Cấu hình' })
  config: Record<string, any>;

  @ApiProperty({ description: 'Thứ tự sắp xếp' })
  sortOrder: number;

  @ApiProperty({ description: 'Ngày tạo' })
  createdAt: Date;

  @ApiProperty({ description: 'Ngày cập nhật' })
  updatedAt: Date;
}
