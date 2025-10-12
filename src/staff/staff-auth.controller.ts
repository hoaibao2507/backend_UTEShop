import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StaffAuthService } from './staff-auth.service';
import { StaffAuthGuard } from './guards/staff-auth.guard';

export class StaffLoginDto {
  email: string;
  password: string;
}

@ApiTags('staff-auth')
@Controller('staff-auth')
export class StaffAuthController {
  constructor(private readonly staffAuthService: StaffAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập staff', description: 'Đăng nhập vào hệ thống staff' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không chính xác' })
  async login(@Body() loginDto: StaffLoginDto) {
    return this.staffAuthService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Làm mới token', description: 'Làm mới access token bằng refresh token' })
  @ApiResponse({ status: 200, description: 'Làm mới token thành công' })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ' })
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    return this.staffAuthService.refreshToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(StaffAuthGuard)
  @ApiOperation({ summary: 'Đăng xuất', description: 'Đăng xuất khỏi hệ thống' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  async logout(@Request() req) {
    return this.staffAuthService.logout(req.user.id);
  }
}





