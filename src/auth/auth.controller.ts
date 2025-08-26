import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { User } from 'src/users/users.entity';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService,
                private readonly usersService: UsersService
    ) {}

    @Post('register')
    async register(
        @Body() body: { name: string; email: string; password: string },
    ): Promise<User> {
        return this.authService.register(body.name, body.email, body.password);
    }

    @Post('verify-otp')
    async verifyOtp(
        @Body() body: { email: string; otp: string },
    ): Promise<{ message: string }> {
        return this.usersService.verifyOtp(body.email, body.otp);
    }

    @Post('login')
    async login(
        @Body() body: { email: string; password: string },
    ): Promise<{ access_token: string; refresh_token: string }> {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }
        return this.authService.login(user);
    }
    @Post('refresh')
    async refresh(@Body() body: { userId: number; refreshToken: string }) {
        return this.authService.refreshToken(body.userId, body.refreshToken);
    }
}
