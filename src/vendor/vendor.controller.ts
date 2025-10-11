import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  ParseIntPipe
} from '@nestjs/common';
import { VendorService } from './vendor.service';
import { VendorAuthService } from './vendor-auth.service';
import { 
  VendorRegistrationDto, 
  VendorApprovalDto, 
  VendorUpdateDto, 
  VendorQueryDto,
  VendorLoginDto
} from './dto/vendor.dto';
import { VendorStatus } from '../entities/vendor.entity';
import { VendorAuthGuard } from './guards/vendor-auth.guard';
import { VendorRoleGuard } from './guards/vendor-role.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('vendors')
@Controller('vendors')
export class VendorController {
  constructor(
    private readonly vendorService: VendorService,
    private readonly vendorAuthService: VendorAuthService
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký nhà cung cấp', description: 'Đăng ký tài khoản nhà cung cấp mới (không yêu cầu xác thực)' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công, chờ duyệt' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Email, username, phone hoặc mã số thuế đã được sử dụng' })
  async register(@Body() vendorRegistrationDto: VendorRegistrationDto) {
    const vendor = await this.vendorService.register(vendorRegistrationDto);
    return {
      message: 'Đăng ký thành công! Vui lòng chờ admin duyệt tài khoản.',
      vendor: {
        vendorId: vendor.vendorId,
        storeName: vendor.storeName,
        email: vendor.email,
        status: vendor.status,
        createdAt: vendor.createdAt
      }
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập nhà cung cấp', description: 'Đăng nhập vào hệ thống với username và password' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Thông tin đăng nhập không chính xác' })
  async login(@Body() vendorLoginDto: VendorLoginDto) {
    return this.vendorAuthService.login(vendorLoginDto);
  }

  @Get()
  @UseGuards(VendorAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách nhà cung cấp', description: 'Lấy danh sách tất cả nhà cung cấp với phân trang và bộ lọc (yêu cầu xác thực admin)' })
  @ApiResponse({ status: 200, description: 'Danh sách nhà cung cấp được trả về thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async findAll(@Query() query: VendorQueryDto) {
    return this.vendorService.findAll(query);
  }

  @Get('pending')
  @UseGuards(VendorAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách nhà cung cấp chờ duyệt', description: 'Lấy danh sách nhà cung cấp đang chờ duyệt (yêu cầu xác thực admin)' })
  @ApiResponse({ status: 200, description: 'Danh sách nhà cung cấp chờ duyệt được trả về thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getPendingApprovals() {
    const vendors = await this.vendorService.getPendingApprovals();
    return {
      vendors,
      total: vendors.length
    };
  }

  @Get('statistics')
  @UseGuards(VendorAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thống kê nhà cung cấp', description: 'Lấy thống kê tổng quan về nhà cung cấp (yêu cầu xác thực admin)' })
  @ApiResponse({ status: 200, description: 'Thống kê nhà cung cấp được trả về thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getStatistics() {
    return this.vendorService.getVendorStatistics();
  }

  @Get(':id')
  @UseGuards(VendorAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin nhà cung cấp', description: 'Lấy thông tin chi tiết của một nhà cung cấp (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Thông tin nhà cung cấp được trả về thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhà cung cấp' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vendorService.findOne(id);
  }

  @Put(':id')
  @UseGuards(VendorAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin nhà cung cấp', description: 'Cập nhật thông tin của một nhà cung cấp (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Thông tin nhà cung cấp được cập nhật thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhà cung cấp' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() vendorUpdateDto: VendorUpdateDto) {
    return this.vendorService.update(id, vendorUpdateDto);
  }

  @Put(':id/approve')
  @UseGuards(VendorAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Duyệt nhà cung cấp', description: 'Duyệt hoặc từ chối đăng ký nhà cung cấp (yêu cầu xác thực admin)' })
  @ApiResponse({ status: 200, description: 'Nhà cung cấp được duyệt thành công' })
  @ApiResponse({ status: 400, description: 'Nhà cung cấp không ở trạng thái chờ duyệt' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhà cung cấp' })
  async approve(@Param('id', ParseIntPipe) id: number, @Body() approvalDto: VendorApprovalDto, @Request() req) {
    const adminId = req.user.adminId || req.user.id;
    approvalDto.adminId = adminId;
    return this.vendorService.approve(id, approvalDto);
  }

  @Put(':id/suspend')
  @UseGuards(VendorAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạm ngưng nhà cung cấp', description: 'Tạm ngưng hoạt động của nhà cung cấp (yêu cầu xác thực admin)' })
  @ApiResponse({ status: 200, description: 'Nhà cung cấp được tạm ngưng thành công' })
  @ApiResponse({ status: 400, description: 'Chỉ có thể tạm ngưng nhà cung cấp đang hoạt động' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhà cung cấp' })
  async suspend(@Param('id', ParseIntPipe) id: number, @Body('reason') reason: string, @Request() req) {
    const adminId = req.user.adminId || req.user.id;
    return this.vendorService.suspend(id, adminId, reason);
  }

  @Put(':id/activate')
  @UseGuards(VendorAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kích hoạt nhà cung cấp', description: 'Kích hoạt lại nhà cung cấp đã bị tạm ngưng (yêu cầu xác thực admin)' })
  @ApiResponse({ status: 200, description: 'Nhà cung cấp được kích hoạt thành công' })
  @ApiResponse({ status: 400, description: 'Chỉ có thể kích hoạt nhà cung cấp đã bị tạm ngưng' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhà cung cấp' })
  async activate(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const adminId = req.user.adminId || req.user.id;
    return this.vendorService.activate(id, adminId);
  }

  @Delete(':id')
  @UseGuards(VendorAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa nhà cung cấp', description: 'Xóa một nhà cung cấp khỏi hệ thống (yêu cầu xác thực admin)' })
  @ApiResponse({ status: 200, description: 'Nhà cung cấp được xóa thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhà cung cấp' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.vendorService.remove(id);
    return { message: 'Nhà cung cấp đã được xóa thành công' };
  }
}
