import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsNotEmpty, 
  Length,
  IsEnum,
  IsNumber,
  IsPositive,
  MinLength,
  Matches
} from 'class-validator';
import { Type } from 'class-transformer';
import { VendorStatus } from '../../entities/vendor.entity';

export class VendorRegistrationDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  storeName: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  ownerName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 20)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  address: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  ward: string;

  @IsString()
  @IsOptional()
  @Length(5, 50)
  businessLicense?: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 13)
  @Matches(/^[0-9]{10,13}$/, { message: 'Mã số thuế phải là số có 10-13 chữ số' })
  taxCode: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  @Length(10, 1000)
  description?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  banner?: string;
}

export class VendorApprovalDto {
  @IsEnum(VendorStatus)
  status: VendorStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  adminId: number;
}

export class VendorUpdateDto {
  @IsString()
  @IsOptional()
  @Length(2, 100)
  storeName?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  ownerName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Length(10, 20)
  phone?: string;

  @IsString()
  @IsOptional()
  @Length(10, 500)
  address?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  city?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  ward?: string;

  @IsString()
  @IsOptional()
  @Length(5, 50)
  businessLicense?: string;

  @IsString()
  @IsOptional()
  @Length(5, 50)
  taxCode?: string;

  @IsString()
  @IsOptional()
  @Length(10, 1000)
  description?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  banner?: string;
}

export class VendorQueryDto {
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit: number = 10;

  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy: string = 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder: 'ASC' | 'DESC' = 'DESC';
}

export class VendorLoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
