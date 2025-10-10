import { Injectable } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { VendorLoginDto } from './dto/vendor.dto';

@Injectable()
export class VendorAuthService {
  constructor(
    private vendorService: VendorService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateVendor(username: string, password: string): Promise<any> {
    const vendor = await this.vendorService.validateVendor(username, password);
    if (vendor) {
      const { password, ...result } = vendor;
      return result;
    }
    return null;
  }

  async login(vendorLoginDto: VendorLoginDto) {
    const vendor = await this.validateVendor(vendorLoginDto.username, vendorLoginDto.password);
    
    if (!vendor) {
      throw new Error('Thông tin đăng nhập không chính xác hoặc tài khoản chưa được duyệt');
    }

    const payload = { 
      vendorId: vendor.vendorId, 
      username: vendor.username, 
      email: vendor.email,
      storeName: vendor.storeName,
      role: 'vendor'
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      vendor: {
        vendorId: vendor.vendorId,
        storeName: vendor.storeName,
        email: vendor.email,
        status: vendor.status,
        logo: vendor.logo,
        banner: vendor.banner
      }
    };
  }

  async refreshToken(vendorId: number, token: string) {
    const vendor = await this.vendorService.findOne(vendorId);

    if (!vendor || vendor.status !== 'active') {
      throw new Error('Refresh token không hợp lệ');
    }

    const payload = { 
      vendorId: vendor.vendorId, 
      username: vendor.username, 
      email: vendor.email,
      storeName: vendor.storeName,
      role: 'vendor'
    };

    const newAccessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    });

    return {
      access_token: newAccessToken,
    };
  }
}

