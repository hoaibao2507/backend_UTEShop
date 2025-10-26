import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
    private googleClient: OAuth2Client;

    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {
        this.googleClient = new OAuth2Client(
            this.configService.get<string>('GOOGLE_CLIENT_ID')
        );
    }

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

    async verifyGoogleToken(token: string): Promise<any> {
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken: token,
                audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
            });

            const payload = ticket.getPayload();
            if (!payload) {
                throw new Error('Invalid Google token');
            }

            return {
                googleId: payload.sub,
                email: payload.email,
                firstName: payload.given_name,
                lastName: payload.family_name,
                avatar: payload.picture,
                emailVerified: payload.email_verified,
            };
        } catch (error) {
            throw new Error('Google token verification failed: ' + error.message);
        }
    }

    async googleLogin(googleToken: string): Promise<{ access_token: string; refresh_token: string; user: any; needPassword: boolean }> {
        try {
            // Verify Google token
            const googleUser = await this.verifyGoogleToken(googleToken);

            if (!googleUser.emailVerified) {
                throw new Error('Google email not verified');
            }

            // Check if user exists by email
            let user = await this.usersRepository.findOne({ 
                where: { email: googleUser.email } 
            });

            if (user) {
                // Debug existing user
                console.log('🔍 Existing user status:');
                console.log('- has googleId:', !!user.googleId);
                console.log('- has provider:', !!user.provider);
                console.log('- has password:', !!user.password);

                // Update existing user with Google info if not already set
                if (!user.googleId) {
                    console.log('🔗 Linking Google account to existing user...');
                    user.googleId = googleUser.googleId;
                    user.provider = 'google';
                    if (!user.avatar && googleUser.avatar) {
                        user.avatar = googleUser.avatar;
                    }
                    await this.usersRepository.save(user);
                    console.log('✅ Google account linked');
                }
            } else {
                console.log('🆕 Creating new Google user...');
                // Validate required fields from Google
                const firstName = googleUser.firstName || 'User';
                const lastName = googleUser.lastName || 'Account';

                // Create new user
                user = this.usersRepository.create({
                    firstName,
                    lastName,
                    email: googleUser.email,
                    googleId: googleUser.googleId,
                    provider: 'google',
                    avatar: googleUser.avatar,
                    isVerified: true, // Google verified emails are considered verified
                    // No password needed for Google users
                });

                user = await this.usersRepository.save(user);
                console.log('✅ New Google user created');
            }

            // Generate JWT tokens
            const tokens = await this.login(user);

            // Check if user needs to set password
            const needPassword = !user.password && user.provider === 'google';
            
            // Reload user to make sure we have latest data
            const latestUser = await this.usersRepository.findOne({ where: { id: user.id } });
            const finalNeedPassword = latestUser ? !latestUser.password && latestUser.provider === 'google' : needPassword;

            // Debug logging
            console.log('🔍 Google Login Debug:');
            console.log('- User ID:', user.id);
            console.log('- Has password:', !!user.password);
            console.log('- Provider:', user.provider);
            console.log('- Need password (before reload):', needPassword);
            console.log('- Need password (after reload):', finalNeedPassword);

            // Return user data without sensitive information
            const { password, otpCode, otpExpiry, refreshToken, ...userData } = user;

            const response = {
                ...tokens,
                user: userData,
                needPassword: finalNeedPassword,
            };

            // Debug full response
            console.log('📤 Google Login Response:');
            console.log('- needPassword:', response.needPassword);
            console.log('- has access_token:', !!response.access_token);

            return response;
        } catch (error) {
            throw new Error('Google login failed: ' + error.message);
        }
    }

    async setPasswordForGoogleUser(userId: number, newPassword: string): Promise<string> {
        // Find user by ID
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        
        if (!user) {
            throw new Error('User không tồn tại');
        }

        // Check if user is a Google user
        if (!user.provider || user.provider !== 'google') {
            throw new Error('Chỉ có thể đặt mật khẩu cho tài khoản Google');
        }

        // Check if user already has a password
        if (user.password) {
            throw new Error('Tài khoản đã có mật khẩu. Vui lòng sử dụng chức năng đổi mật khẩu.');
        }

        // Validate password
        if (!newPassword || newPassword.length < 6) {
            throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update user password
        user.password = hashedPassword;
        await this.usersRepository.save(user);

        return 'Mật khẩu đã được thiết lập thành công';
    }

}
