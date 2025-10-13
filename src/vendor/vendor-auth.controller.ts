import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { VendorAuthService } from './vendor-auth.service';
import { VendorLoginDto } from './dto/vendor.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('vendor-auth')
@Controller('vendor-auth')
export class VendorAuthController {
  constructor(private readonly vendorAuthService: VendorAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập nhà cung cấp', description: 'Đăng nhập vào hệ thống với username và password' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Thông tin đăng nhập không chính xác' })
  async login(@Body() vendorLoginDto: VendorLoginDto) {
    return this.vendorAuthService.login(vendorLoginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Làm mới token', description: 'Làm mới access token bằng refresh token' })
  @ApiResponse({ status: 200, description: 'Token được làm mới thành công' })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ' })
  async refreshToken(@Body('refresh_token') refreshToken: string, @Request() req) {
    const vendorId = req.user.vendorId;
    return this.vendorAuthService.refreshToken(vendorId, refreshToken);
  }
}






