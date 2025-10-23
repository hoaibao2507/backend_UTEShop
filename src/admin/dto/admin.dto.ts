import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsNotEmpty, 
  Length,
  IsEnum,
  MinLength
} from 'class-validator';
import { AdminRole } from '../../entities/admin.entity';

export class AdminLoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AdminCreateDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(AdminRole)
  @IsOptional()
  role?: AdminRole;

  @IsString()
  @IsOptional()
  description?: string;
}

export class AdminUpdateDto {
  @IsString()
  @IsOptional()
  @Length(2, 100)
  fullName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Length(3, 50)
  username?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsEnum(AdminRole)
  @IsOptional()
  role?: AdminRole;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}

export class AdminChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}







