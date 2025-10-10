import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsNotEmpty, 
  Length,
  IsEnum,
  MinLength
} from 'class-validator';
import { UserRole } from '../../users/users.entity';

export class StaffCreateDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

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
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

export class StaffUpdateDto {
  @IsString()
  @IsOptional()
  @Length(2, 50)
  firstName?: string;

  @IsString()
  @IsOptional()
  @Length(2, 50)
  lastName?: string;

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
  avatar?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

export class StaffChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

export class StaffQueryDto {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @Length(1, 100)
  search?: string;
}


