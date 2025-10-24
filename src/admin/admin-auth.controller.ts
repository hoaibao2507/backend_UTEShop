import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin.dto';
import { AdminAuthGuard } from './guards/admin-auth.guard';

@ApiTags('admin-auth')
@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập admin', description: 'Đăng nhập vào hệ thống admin' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Tên đăng nhập hoặc mật khẩu không chính xác' })
  async login(@Body() adminLoginDto: AdminLoginDto) {
    return this.adminAuthService.login(adminLoginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Làm mới token', description: 'Làm mới access token bằng refresh token' })
  @ApiResponse({ status: 200, description: 'Làm mới token thành công' })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ' })
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    return this.adminAuthService.refreshToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Đăng xuất', description: 'Đăng xuất khỏi hệ thống' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  async logout(@Request() req) {
    return this.adminAuthService.logout(req.user.adminId);
  }
}

