import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin.dto';
import { Admin } from '../entities/admin.entity';
import * as crypto from 'crypto';

@Injectable()
export class AdminAuthService {
  constructor(
    private adminService: AdminService,
    private jwtService: JwtService,
  ) {}

  async login(adminLoginDto: AdminLoginDto) {
    const admin = await this.adminService.validateAdmin(
      adminLoginDto.username,
      adminLoginDto.password,
    );

    if (!admin) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    // Update last login
    await this.adminService.updateLastLogin(admin.adminId);

    // Generate tokens
    const payload = { 
      sub: admin.adminId, 
      username: admin.username, 
      email: admin.email,
      role: admin.role,
      type: 'admin'
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.generateRefreshToken();

    // Save refresh token
    await this.adminService.updateRefreshToken(admin.adminId, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      admin: {
        adminId: admin.adminId,
        fullName: admin.fullName,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        avatar: admin.avatar,
        isActive: admin.isActive,
        lastLoginAt: admin.lastLoginAt,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    const admin = await this.adminService.findByRefreshToken(refreshToken);

    if (!admin) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    // Generate new tokens
    const payload = { 
      sub: admin.adminId, 
      username: admin.username, 
      email: admin.email,
      role: admin.role,
      type: 'admin'
    };

    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.generateRefreshToken();

    // Update refresh token
    await this.adminService.updateRefreshToken(admin.adminId, newRefreshToken);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async logout(adminId: number) {
    await this.adminService.updateRefreshToken(adminId, undefined);
    return { message: 'Đăng xuất thành công' };
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async validateAdminById(adminId: number): Promise<Admin> {
    return await this.adminService.findOne(adminId);
  }
}
