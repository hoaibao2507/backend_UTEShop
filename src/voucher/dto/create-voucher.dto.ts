import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Length, Max, Min } from 'class-validator';
import { VoucherDiscountType } from '../../entities/enums/voucher-discount-type.enum';

export class CreateVoucherDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 50)
    code: string;

    @IsString()
    @IsOptional()
    @Length(0, 255)
    description?: string;

    @IsEnum(VoucherDiscountType)
    discountType: VoucherDiscountType;

    @IsOptional()
    @IsNumber()
    discountValue?: number;

    @IsNumber()
    @Min(0)
    minOrderValue: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    maxDiscount?: number;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    usageLimit?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    perUserLimit?: number;

    @IsOptional()
    @IsBoolean()
    combinable?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}


