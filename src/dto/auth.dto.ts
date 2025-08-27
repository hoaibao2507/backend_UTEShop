import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

// Register DTO
export class RegisterDto {
    @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'johndoe', description: 'Unique username' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: 'john@example.com', description: 'User email address' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'password123', description: 'User password' })
    @IsString()
    @MinLength(6)
    password: string;
}

// Login DTO
export class LoginDto {
    @ApiProperty({ example: 'johndoe', description: 'Username for login' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: 'password123', description: 'User password' })
    @IsString()
    @IsNotEmpty()
    password: string;
}

// Verify OTP DTO
export class VerifyOtpDto {
    @ApiProperty({ example: 'john@example.com', description: 'Email address' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: '123456', description: '6-digit OTP code' })
    @IsString()
    @IsNotEmpty()
    otp: string;
}

// Refresh Token DTO
export class RefreshTokenDto {
    @ApiProperty({ example: 1, description: 'User ID' })
    userId: number;

    @ApiProperty({ description: 'Refresh token' })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

// Forgot Password DTO
export class ForgotPasswordDto {
    @ApiProperty({ example: 'john@example.com', description: 'Email address' })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

// Reset Password DTO
export class ResetPasswordDto {
    @ApiProperty({ example: 'john@example.com', description: 'Email address' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: '123456', description: '6-digit OTP code' })
    @IsString()
    @IsNotEmpty()
    otp: string;

    @ApiProperty({ example: 'newpassword123', description: 'New password' })
    @IsString()
    @MinLength(6)
    newPassword: string;
}

// Login Response DTO
export class LoginResponseDto {
    @ApiProperty({ description: 'JWT access token' })
    access_token: string;

    @ApiProperty({ description: 'JWT refresh token' })
    refresh_token: string;
}

// Refresh Token Response DTO
export class RefreshTokenResponseDto {
    @ApiProperty({ description: 'New JWT access token' })
    access_token: string;
}

// Message Response DTO
export class MessageResponseDto {
    @ApiProperty({ example: 'Operation completed successfully' })
    message: string;
}
