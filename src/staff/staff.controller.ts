import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Request,
  ParseIntPipe,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { StaffCreateDto, StaffUpdateDto, StaffChangePasswordDto, StaffQueryDto } from './dto/staff.dto';
import { StaffAuthGuard } from './guards/staff-auth.guard';
import { StaffRoleGuard } from './guards/staff-role.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../users/users.entity';

@ApiTags('staff')
@Controller('staff')
@UseGuards(StaffAuthGuard)
@ApiBearerAuth()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @UseGuards(StaffRoleGuard)
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Tạo staff mới', description: 'Chỉ Manager mới có thể tạo staff mới' })
  @ApiResponse({ status: 201, description: 'Tạo staff thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Email hoặc phone đã được sử dụng' })
  async create(@Body() staffCreateDto: StaffCreateDto) {
    const staff = await this.staffService.create(staffCreateDto);
    return {
      message: 'Tạo staff thành công',
      staff: {
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        isActive: staff.isActive,
        createdAt: staff.createdAt,
      },
    };
  }

  @Get()
  @UseGuards(StaffRoleGuard)
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Lấy danh sách staff', description: 'Lấy danh sách tất cả staff (Manager only)' })
  @ApiResponse({ status: 200, description: 'Danh sách staff' })
  async findAll(@Query() query: StaffQueryDto) {
    const staff = await this.staffService.findAll(query);
    return {
      message: 'Lấy danh sách staff thành công',
      staff,
    };
  }

  @Get('statistics')
  @UseGuards(StaffRoleGuard)
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Thống kê staff', description: 'Lấy thống kê về staff (Manager only)' })
  @ApiResponse({ status: 200, description: 'Thống kê staff' })
  async getStatistics() {
    const statistics = await this.staffService.getStaffStatistics();
    return {
      message: 'Lấy thống kê staff thành công',
      statistics,
    };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Lấy thông tin profile', description: 'Lấy thông tin profile của staff hiện tại' })
  @ApiResponse({ status: 200, description: 'Thông tin profile' })
  async getProfile(@Request() req) {
    const staff = await this.staffService.findOne(req.user.id);
    return {
      message: 'Lấy thông tin profile thành công',
      staff,
    };
  }

  @Get(':id')
  @UseGuards(StaffRoleGuard)
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Lấy thông tin staff', description: 'Lấy thông tin chi tiết của staff (Manager only)' })
  @ApiResponse({ status: 200, description: 'Thông tin staff' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy staff' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const staff = await this.staffService.findOne(id);
    return {
      message: 'Lấy thông tin staff thành công',
      staff,
    };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Cập nhật profile', description: 'Cập nhật thông tin profile của staff hiện tại' })
  @ApiResponse({ status: 200, description: 'Cập nhật profile thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async updateProfile(@Request() req, @Body() staffUpdateDto: StaffUpdateDto) {
    const staff = await this.staffService.update(req.user.id, staffUpdateDto);
    return {
      message: 'Cập nhật profile thành công',
      staff: {
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        avatar: staff.avatar,
        updatedAt: staff.updatedAt,
      },
    };
  }

  @Patch(':id')
  @UseGuards(StaffRoleGuard)
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Cập nhật staff', description: 'Cập nhật thông tin staff (Manager only)' })
  @ApiResponse({ status: 200, description: 'Cập nhật staff thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy staff' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() staffUpdateDto: StaffUpdateDto) {
    const staff = await this.staffService.update(id, staffUpdateDto);
    return {
      message: 'Cập nhật staff thành công',
      staff: {
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        isActive: staff.isActive,
        updatedAt: staff.updatedAt,
      },
    };
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'Đổi mật khẩu', description: 'Đổi mật khẩu của staff hiện tại' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Mật khẩu hiện tại không chính xác' })
  async changePassword(@Request() req, @Body() changePasswordDto: StaffChangePasswordDto) {
    await this.staffService.changePassword(req.user.id, changePasswordDto);
    return {
      message: 'Đổi mật khẩu thành công',
    };
  }

  @Patch(':id/toggle-active')
  @UseGuards(StaffRoleGuard)
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Bật/tắt staff', description: 'Bật hoặc tắt trạng thái hoạt động của staff' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy staff' })
  async toggleActive(@Param('id', ParseIntPipe) id: number) {
    const staff = await this.staffService.toggleActive(id);
    return {
      message: `Staff đã được ${staff.isActive ? 'kích hoạt' : 'vô hiệu hóa'}`,
      staff: {
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        isActive: staff.isActive,
      },
    };
  }

  @Delete(':id')
  @UseGuards(StaffRoleGuard)
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Xóa staff', description: 'Xóa staff (Manager only)' })
  @ApiResponse({ status: 200, description: 'Xóa staff thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy staff' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.staffService.remove(id);
    return {
      message: 'Xóa staff thành công',
    };
  }
}



