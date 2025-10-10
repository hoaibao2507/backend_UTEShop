import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StaffService } from './staff.service';
import { UserRole } from '../users/users.entity';
import * as crypto from 'crypto';

@Injectable()
export class StaffAuthService {
  constructor(
    private staffService: StaffService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.staffService.validateStaff(email, password);

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // Update last login
    await this.staffService.updateLastLogin(user.id);

    // Generate tokens
    const payload = { 
      sub: user.id, 
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      type: 'staff'
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.generateRefreshToken();

    // Save refresh token
    await this.staffService.updateRefreshToken(user.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      staff: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    const user = await this.staffService.findByRefreshToken(refreshToken);

    if (!user) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    // Check if user is staff or manager
    if (user.role !== UserRole.STAFF && user.role !== UserRole.MANAGER) {
      throw new UnauthorizedException('Tài khoản không có quyền truy cập');
    }

    // Generate new tokens
    const payload = { 
      sub: user.id, 
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      type: 'staff'
    };

    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.generateRefreshToken();

    // Update refresh token
    await this.staffService.updateRefreshToken(user.id, newRefreshToken);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async logout(userId: number) {
    await this.staffService.updateRefreshToken(userId, undefined);
    return { message: 'Đăng xuất thành công' };
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async validateStaffById(userId: number) {
    return await this.staffService.findOne(userId);
  }
}

