import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    async register(firstName: string, lastName: string, email: string, password: string, phone?: string, address?: string, city?: string, gender?: string, dateOfBirth?: string): Promise<User> {
        // Kiểm tra email đã tồn tại chưa
        const existingUser = await this.usersRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('Email đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.');
        }

        // Kiểm tra phone đã tồn tại chưa (nếu có)
        if (phone) {
            const existingPhone = await this.usersRepository.findOne({ where: { phone } });
            if (existingPhone) {
                throw new Error('Số điện thoại đã được sử dụng. Vui lòng chọn số khác.');
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // mã OTP 6 chữ số
        const expiry = Date.now() + 5 * 60 * 1000; // OTP hết hạn sau 5 phút

        const user = this.usersRepository.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            address,
            city,
            gender: gender as any,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            otpCode: otp,
            otpExpiry: expiry,
            isVerified: false,
        });

        const savedUser = await this.usersRepository.save(user);

        await this.sendOtpEmail(email, otp);

        return savedUser;
    }

    private async sendOtpEmail(email: string, otp: string) {
        const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'duongnguyenhoaibao2507@gmail.com',
            pass: 'iokm ejef vvkv eggc',
        },
        });

        await transporter.sendMail({
        from: '"UTEShop" <duongnguyenhoaibao2507@gmail.com>',
        to: email,
        subject: 'Mã OTP xác thực',
        text: `Mã OTP của bạn là: ${otp}`,
        });
    }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.usersRepository.findOne({ where: { email } });
        if (user && user.isVerified) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const { password, ...result } = user;
            return result;
        }
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
        });

        // lưu refresh token vào DB
        await this.usersRepository.update(user.id, { refreshToken });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }

    async refreshToken(userId: number, token: string) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });

        if (!user || user.refreshToken !== token) {
            throw new Error('Refresh token không hợp lệ');
        }

        const payload = { email: user.email, sub: user.id };

        const newAccessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
        });

        return {
            access_token: newAccessToken,
        };
    }
    async forgotPassword(email: string): Promise<string> {
        const user = await this.usersRepository.findOne({ where: { email } });
        if (!user) {
            throw new Error('Email không tồn tại');
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = Date.now() + 5 * 60 * 1000; // 5 phút

        user.otpCode = otp;
        user.otpExpiry = expiry;
        await this.usersRepository.save(user);

        await this.sendOtpEmail(email, otp);

        return 'OTP đã được gửi tới email của bạn';
    }

    async resetPassword(email: string, otp: string, newPassword: string): Promise<string> {
        const user = await this.usersRepository.findOne({ where: { email } });
        if (!user) {
            throw new Error('Email không tồn tại');
        }

        if (user.otpCode !== otp || Date.now() > user.otpExpiry) {
            throw new Error('OTP không hợp lệ hoặc đã hết hạn');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // reset lại OTP để không dùng lại được
        user.otpCode = "";
        user.otpExpiry = 0;

        await this.usersRepository.save(user);

        return 'Mật khẩu đã được đặt lại thành công';
    }

}
