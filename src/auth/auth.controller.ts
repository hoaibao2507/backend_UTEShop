import { Controller, Post, Body, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { User } from 'src/users/users.entity';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService,
                private readonly usersService: UsersService
    ) {}

    @Post('register')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                firstName: { type: 'string', example: 'John', description: 'Tên' },
                lastName: { type: 'string', example: 'Doe', description: 'Họ' },
                email: { type: 'string', example: 'abc@gmail.com', description: 'Email' },
                password: { type: 'string', example: 'password123', description: 'Mật khẩu' },
                phone: { type: 'string', example: '0123456789', description: 'Số điện thoại (tùy chọn)' },
                address: { type: 'string', example: '123 Đường ABC', description: 'Địa chỉ (tùy chọn)' },
                city: { type: 'string', example: 'TP.HCM', description: 'Thành phố (tùy chọn)' },
                gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'male', description: 'Giới tính (tùy chọn)' },
                dateOfBirth: { type: 'string', format: 'date', example: '1990-01-01', description: 'Ngày sinh (tùy chọn)' }
            },
            required: ['firstName', 'lastName', 'email', 'password']
        }
    })
    async register(
        @Body() body: any,
    ): Promise<User> {
        try {
            // Kiểm tra body và các trường bắt buộc
            if (!body || !body.firstName || !body.lastName || !body.email || !body.password) {
                throw new BadRequestException('FirstName, lastName, email và password là bắt buộc');
            }

            // Kiểm tra email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(body.email)) {
                throw new BadRequestException('Email không hợp lệ');
            }

            // Kiểm tra độ dài password
            if (body.password.length < 6) {
                throw new BadRequestException('Password phải có ít nhất 6 ký tự');
            }

            // Kiểm tra độ dài firstName và lastName
            if (body.firstName.length < 2) {
                throw new BadRequestException('FirstName phải có ít nhất 2 ký tự');
            }

            if (body.lastName.length < 2) {
                throw new BadRequestException('LastName phải có ít nhất 2 ký tự');
            }

            // Kiểm tra phone format nếu có
            if (body.phone && !/^[0-9+\-\s()]+$/.test(body.phone)) {
                throw new BadRequestException('Số điện thoại không hợp lệ');
            }

            // Kiểm tra gender nếu có
            if (body.gender && !['male', 'female', 'other'].includes(body.gender)) {
                throw new BadRequestException('Giới tính không hợp lệ');
            }

            // Kiểm tra dateOfBirth format nếu có
            if (body.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(body.dateOfBirth)) {
                throw new BadRequestException('Ngày sinh không đúng định dạng (YYYY-MM-DD)');
            }

            return await this.authService.register(
                body.firstName,
                body.lastName,
                body.email,
                body.password,
                body.phone,
                body.address,
                body.city,
                body.gender,
                body.dateOfBirth
            );
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Register error:', error);
            throw new InternalServerErrorException('Lỗi đăng ký: ' + error.message);
        }
    }

    @Post('verify-otp')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'abc@gmail.com', description: 'Email cần xác thực' },
                otp: { type: 'string', example: '123456', description: 'Mã OTP 6 chữ số' },
            },
            required: ['email', 'otp']
        }
    })
    async verifyOtp(
        @Body() body: any,
    ): Promise<{ message: string; user?: User; access_token?: string; refresh_token?: string }> {
        try {
            // Kiểm tra body và các trường bắt buộc
            if (!body || !body.email || !body.otp) {
                throw new BadRequestException('Email và OTP là bắt buộc');
            }

            // Kiểm tra email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(body.email)) {
                throw new BadRequestException('Email không hợp lệ');
            }

            // Kiểm tra OTP format (6 chữ số)
            if (!/^\d{6}$/.test(body.otp)) {
                throw new BadRequestException('OTP phải là 6 chữ số');
            }

            const result = await this.usersService.verifyOtp(body.email, body.otp);
            
            // Nếu xác thực thành công, tạo token và refreshToken
            if (result.user) {
                const tokens = await this.authService.login(result.user);
                return {
                    message: result.message,
                    user: result.user,
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token
                };
            }
            
            // Nếu xác thực không thành công, chỉ trả về message
            return { message: result.message };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Verify OTP error:', error);
            throw new InternalServerErrorException('Lỗi xác thực OTP: ' + error.message);
        }
    }

    @Post('login')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'abc@gmail.com', description: 'Email' },
                password: { type: 'string', example: 'password123', description: 'Mật khẩu' },
            },
            required: ['email', 'password']
        }
    })
    async login(
        @Body() body: any,
    ): Promise<{ access_token: string; refresh_token: string }> {
        try {
            if (!body || !body.email || !body.password) {
                throw new BadRequestException('Email và password là bắt buộc');
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(body.email)) {
                throw new BadRequestException('Email không hợp lệ');
            }

            const user = await this.authService.validateUser(body.email, body.password);
            if (!user) {
                throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
            }
            return await this.authService.login(user);
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
                throw error;
            }
            console.error('Login error:', error);
            throw new InternalServerErrorException('Lỗi đăng nhập: ' + error.message);
        }
    }
    
    @Post('refresh')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                userId: { type: 'number', example: 1, description: 'ID của user' },
                refreshToken: { type: 'string', example: 'refresh_token_here', description: 'Refresh token' },
            },
            required: ['userId', 'refreshToken']
        }
    })
    async refresh(@Body() body: any) {
        try {
            if (!body || !body.userId || !body.refreshToken) {
                throw new BadRequestException('UserId và refreshToken là bắt buộc');
            }
            return await this.authService.refreshToken(body.userId, body.refreshToken);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Refresh token error:', error);
            throw new InternalServerErrorException('Lỗi refresh token: ' + error.message);
        }
    }

    @Post('forgot-password')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'abc@gmail.com', description: 'Email' },
            },
            required: ['email']
        }
    })
    async forgotPassword(@Body() body: any) {
        try {
            if (!body || !body.email) {
                throw new BadRequestException('Email là bắt buộc');
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(body.email)) {
                throw new BadRequestException('Email không hợp lệ');
            }

            return await this.authService.forgotPassword(body.email);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Forgot password error:', error);
            throw new InternalServerErrorException('Lỗi quên mật khẩu: ' + error.message);
        }
    }

    @Post('reset-password')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'abc@gmail.com', description: 'Email' },
                otp: { type: 'string', example: '123456', description: 'Mã OTP 6 chữ số' },
                newPassword: { type: 'string', example: 'newpassword123', description: 'Mật khẩu mới' },
            },
            required: ['email', 'otp', 'newPassword']
        }
    })
    async resetPassword(@Body() body: any) {
        try {
            if (!body || !body.email || !body.otp || !body.newPassword) {
                throw new BadRequestException('Email, OTP và newPassword là bắt buộc');
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(body.email)) {
                throw new BadRequestException('Email không hợp lệ');
            }

            if (!/^\d{6}$/.test(body.otp)) {
                throw new BadRequestException('OTP phải là 6 chữ số');
            }

            if (body.newPassword.length < 6) {
                throw new BadRequestException('Password mới phải có ít nhất 6 ký tự');
            }

            return await this.authService.resetPassword(body.email, body.otp, body.newPassword);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Reset password error:', error);
            throw new InternalServerErrorException('Lỗi đặt lại mật khẩu: ' + error.message);
        }
    }
}
