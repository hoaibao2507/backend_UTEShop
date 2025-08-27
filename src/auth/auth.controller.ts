import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { User } from 'src/users/users.entity';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { ApiBody, ApiConsumes, ApiTags, ApiResponse } from '@nestjs/swagger';
import { 
    RegisterDto, 
    LoginDto, 
    VerifyOtpDto, 
    RefreshTokenDto, 
    ForgotPasswordDto, 
    ResetPasswordDto,
    LoginResponseDto,
    MessageResponseDto,
    RefreshTokenResponseDto
} from 'src/dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService,
                private readonly usersService: UsersService
    ) {}

    @Post('register')
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, description: 'User registered successfully', type: User })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async register(@Body() registerDto: RegisterDto): Promise<User> {
        return this.authService.register(
            registerDto.name, 
            registerDto.username, 
            registerDto.email, 
            registerDto.password
        );
    }

    @Post('verify-otp')
    @ApiBody({ type: VerifyOtpDto })
    @ApiResponse({ status: 200, description: 'OTP verified successfully', type: MessageResponseDto })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<MessageResponseDto> {
        if (!verifyOtpDto.email || !verifyOtpDto.otp) {
            throw new UnauthorizedException('Email và OTP là bắt buộc');
        }
        return this.usersService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
    }

    @Post('login')
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
        const user = await this.authService.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Username hoặc mật khẩu không đúng');
        }
        return this.authService.login(user);
    }
    
    @Post('refresh')
    @ApiBody({ type: RefreshTokenDto })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully', type: RefreshTokenResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
        return this.authService.refreshToken(refreshTokenDto.userId, refreshTokenDto.refreshToken);
    }

    @Post('forgot-password')
    @ApiBody({ type: ForgotPasswordDto })
    @ApiResponse({ status: 200, description: 'OTP sent successfully', type: MessageResponseDto })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<MessageResponseDto> {
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }

    @Post('reset-password')
    @ApiBody({ type: ResetPasswordDto })
    @ApiResponse({ status: 200, description: 'Password reset successfully', type: MessageResponseDto })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<MessageResponseDto> {
        return this.authService.resetPassword(
            resetPasswordDto.email, 
            resetPasswordDto.otp, 
            resetPasswordDto.newPassword
        );
    }
}
