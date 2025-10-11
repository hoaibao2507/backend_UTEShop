import { 
  Controller, 
  Get, 
  Body, 
  Patch, 
  UseGuards,
  Request,
  Param,
  ParseIntPipe,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminUpdateDto, AdminChangePasswordDto } from './dto/admin.dto';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminRoleGuard } from './guards/admin-role.guard';
import { Roles } from './decorators/roles.decorator';
import { AdminRole } from '../entities/admin.entity';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}



  @Get('profile')
  @ApiOperation({ summary: 'Lấy thông tin profile', description: 'Lấy thông tin profile của admin hiện tại' })
  @ApiResponse({ status: 200, description: 'Thông tin profile' })
  async getProfile(@Request() req) {
    const admin = await this.adminService.findOne(req.user.adminId);
    return {
      message: 'Lấy thông tin profile thành công',
      admin,
    };
  }


  @Patch('profile')
  @ApiOperation({ summary: 'Cập nhật profile', description: 'Cập nhật thông tin profile của admin hiện tại' })
  @ApiResponse({ status: 200, description: 'Cập nhật profile thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async updateProfile(@Request() req, @Body() adminUpdateDto: AdminUpdateDto) {
    const admin = await this.adminService.update(req.user.adminId, adminUpdateDto);
    return {
      message: 'Cập nhật profile thành công',
      admin: {
        adminId: admin.adminId,
        fullName: admin.fullName,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        avatar: admin.avatar,
        description: admin.description,
        updatedAt: admin.updatedAt,
      },
    };
  }


  @Patch('change-password')
  @ApiOperation({ summary: 'Đổi mật khẩu', description: 'Đổi mật khẩu của admin hiện tại' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Mật khẩu hiện tại không chính xác' })
  async changePassword(@Request() req, @Body() changePasswordDto: AdminChangePasswordDto) {
    await this.adminService.changePassword(req.user.adminId, changePasswordDto);
    return {
      message: 'Đổi mật khẩu thành công',
    };
  }

  @Get('customers')
  @UseGuards(AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Danh sách customer', description: 'Lấy danh sách tất cả customer (Admin only)' })
  @ApiResponse({ status: 200, description: 'Danh sách customer' })
  async getCustomers(@Query() query: any) {
    const customers = await this.adminService.getCustomers(query);
    return {
      message: 'Lấy danh sách customer thành công',
      customers,
    };
  }

  @Get('customers/statistics')
  @UseGuards(AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Thống kê customer', description: 'Lấy thống kê về customer (Admin only)' })
  @ApiResponse({ status: 200, description: 'Thống kê customer' })
  async getCustomerStatistics() {
    const statistics = await this.adminService.getCustomerStatistics();
    return {
      message: 'Lấy thống kê customer thành công',
      statistics,
    };
  }

  @Get('customers/:id')
  @UseGuards(AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Chi tiết customer', description: 'Lấy thông tin chi tiết customer (Admin only)' })
  @ApiResponse({ status: 200, description: 'Thông tin customer' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy customer' })
  async getCustomer(@Param('id', ParseIntPipe) id: number) {
    const customer = await this.adminService.getCustomer(id);
    return {
      message: 'Lấy thông tin customer thành công',
      customer,
    };
  }

  @Patch('customers/:id/toggle-active')
  @UseGuards(AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Bật/tắt customer', description: 'Bật hoặc tắt trạng thái hoạt động của customer' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy customer' })
  async toggleCustomerActive(@Param('id', ParseIntPipe) id: number) {
    const customer = await this.adminService.toggleCustomerActive(id);
    return {
      message: `Customer đã được ${customer.isActive ? 'kích hoạt' : 'vô hiệu hóa'}`,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        isActive: customer.isActive,
      },
    };
  }


}
