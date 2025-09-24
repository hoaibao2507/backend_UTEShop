import { IsString, IsOptional, IsNumber, IsEnum, IsObject, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID đơn hàng', example: 1 })
  @IsNumber()
  orderId: number;

  @ApiProperty({ description: 'ID phương thức thanh toán', example: 1 })
  @IsNumber()
  paymentMethodId: number;

  @ApiProperty({ description: 'Số tiền thanh toán', example: 100000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Loại tiền tệ', default: 'VND' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Mô tả thanh toán' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Dữ liệu bổ sung', type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Thời gian hết hạn thanh toán' })
  @IsOptional()
  @IsDateString()
  expiredAt?: string;
}

export class UpdatePaymentDto {
  @ApiPropertyOptional({ description: 'Trạng thái thanh toán' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ description: 'ID giao dịch từ gateway' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Mô tả thanh toán' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Dữ liệu bổ sung' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Thời gian thanh toán thành công' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ description: 'Thời gian hết hạn thanh toán' })
  @IsOptional()
  @IsDateString()
  expiredAt?: string;
}

export class PaymentResponseDto {
  @ApiProperty({ description: 'ID thanh toán' })
  id: number;

  @ApiProperty({ description: 'ID đơn hàng' })
  orderId: number;

  @ApiProperty({ description: 'ID phương thức thanh toán' })
  paymentMethodId: number;

  @ApiProperty({ description: 'Trạng thái thanh toán' })
  status: PaymentStatus;

  @ApiProperty({ description: 'Số tiền thanh toán' })
  amount: number;

  @ApiProperty({ description: 'Loại tiền tệ' })
  currency: string;

  @ApiProperty({ description: 'ID giao dịch từ gateway' })
  transactionId: string;

  @ApiProperty({ description: 'Mô tả thanh toán' })
  description: string;

  @ApiProperty({ description: 'Dữ liệu bổ sung' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Thời gian thanh toán thành công' })
  paidAt: Date;

  @ApiProperty({ description: 'Thời gian hết hạn thanh toán' })
  expiredAt: Date;

  @ApiProperty({ description: 'Ngày tạo' })
  createdAt: Date;

  @ApiProperty({ description: 'Ngày cập nhật' })
  updatedAt: Date;
}

export class PaymentStatusUpdateDto {
  @ApiProperty({ description: 'Trạng thái thanh toán mới' })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiPropertyOptional({ description: 'ID giao dịch từ gateway' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Dữ liệu bổ sung từ gateway' })
  @IsOptional()
  @IsObject()
  gatewayData?: Record<string, any>;
}
