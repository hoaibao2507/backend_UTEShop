import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentMethodService } from './payment-method.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto, PaymentMethodResponseDto } from './dto/payment-method.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@ApiTags('Payment Methods')
@Controller('payment-methods')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo phương thức thanh toán mới', description: 'Tạo một phương thức thanh toán mới (yêu cầu xác thực)' })
  @ApiResponse({ status: 201, description: 'Phương thức thanh toán được tạo thành công', type: PaymentMethodResponseDto })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Phương thức thanh toán đã tồn tại' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async create(@Body() createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodService.create(createPaymentMethodDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả phương thức thanh toán', description: 'Lấy danh sách tất cả phương thức thanh toán (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Danh sách phương thức thanh toán được trả về thành công', type: [PaymentMethodResponseDto] })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async findAll(): Promise<PaymentMethodResponseDto[]> {
    return this.paymentMethodService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Lấy danh sách phương thức thanh toán đang hoạt động', description: 'Lấy danh sách các phương thức thanh toán đang được kích hoạt (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Danh sách phương thức thanh toán đang hoạt động được trả về thành công', type: [PaymentMethodResponseDto] })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async findActive(): Promise<PaymentMethodResponseDto[]> {
    return this.paymentMethodService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin phương thức thanh toán theo ID', description: 'Lấy thông tin chi tiết của một phương thức thanh toán (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Thông tin phương thức thanh toán được trả về thành công', type: PaymentMethodResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phương thức thanh toán' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodService.findOne(id);
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Lấy thông tin phương thức thanh toán theo tên', description: 'Lấy thông tin chi tiết của một phương thức thanh toán theo tên (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Thông tin phương thức thanh toán được trả về thành công', type: PaymentMethodResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phương thức thanh toán' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async findByName(@Param('name') name: string): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodService.findByName(name);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật phương thức thanh toán', description: 'Cập nhật thông tin của một phương thức thanh toán (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Phương thức thanh toán được cập nhật thành công', type: PaymentMethodResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phương thức thanh toán' })
  @ApiResponse({ status: 409, description: 'Tên phương thức thanh toán đã tồn tại' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodService.update(id, updatePaymentMethodDto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Bật/tắt phương thức thanh toán', description: 'Chuyển đổi trạng thái hoạt động của phương thức thanh toán (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Trạng thái phương thức thanh toán được cập nhật thành công', type: PaymentMethodResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phương thức thanh toán' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async toggleActive(@Param('id', ParseIntPipe) id: number): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodService.toggleActive(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa phương thức thanh toán', description: 'Xóa một phương thức thanh toán (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Phương thức thanh toán được xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phương thức thanh toán' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.paymentMethodService.remove(id);
    return { message: 'Payment method deleted successfully' };
  }
}

