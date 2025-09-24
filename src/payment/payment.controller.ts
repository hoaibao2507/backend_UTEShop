import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, UpdatePaymentDto, PaymentResponseDto, PaymentStatusUpdateDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { PaymentStatus } from '../entities/payment.entity';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo thanh toán mới', description: 'Tạo một thanh toán mới cho đơn hàng (yêu cầu xác thực)' })
  @ApiResponse({ status: 201, description: 'Thanh toán được tạo thành công', type: PaymentResponseDto })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng hoặc phương thức thanh toán' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async create(@Body() createPaymentDto: CreatePaymentDto): Promise<PaymentResponseDto> {
    return this.paymentService.create(createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả thanh toán', description: 'Lấy danh sách tất cả thanh toán (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Danh sách thanh toán được trả về thành công', type: [PaymentResponseDto] })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async findAll(): Promise<PaymentResponseDto[]> {
    return this.paymentService.findAll();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Lấy thống kê thanh toán', description: 'Lấy thống kê tổng quan về thanh toán (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Thống kê thanh toán được trả về thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getStatistics(): Promise<{
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    totalAmount: number;
  }> {
    return this.paymentService.getPaymentStatistics();
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Lấy thanh toán theo trạng thái', description: 'Lấy danh sách thanh toán theo trạng thái (yêu cầu xác thực)' })
  @ApiQuery({ name: 'status', enum: PaymentStatus, description: 'Trạng thái thanh toán' })
  @ApiResponse({ status: 200, description: 'Danh sách thanh toán theo trạng thái được trả về thành công', type: [PaymentResponseDto] })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async findByStatus(@Param('status') status: PaymentStatus): Promise<PaymentResponseDto[]> {
    return this.paymentService.findByStatus(status);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Lấy thanh toán theo đơn hàng', description: 'Lấy thông tin thanh toán của một đơn hàng (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Thông tin thanh toán được trả về thành công', type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thanh toán cho đơn hàng này' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async findByOrderId(@Param('orderId', ParseIntPipe) orderId: number): Promise<PaymentResponseDto> {
    return this.paymentService.findByOrderId(orderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin thanh toán theo ID', description: 'Lấy thông tin chi tiết của một thanh toán (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Thông tin thanh toán được trả về thành công', type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thanh toán' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PaymentResponseDto> {
    return this.paymentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thanh toán', description: 'Cập nhật thông tin của một thanh toán (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Thanh toán được cập nhật thành công', type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thanh toán' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.update(id, updatePaymentDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái thanh toán', description: 'Cập nhật trạng thái thanh toán (thường dùng cho webhook từ gateway) (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Trạng thái thanh toán được cập nhật thành công', type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thanh toán' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusUpdateDto: PaymentStatusUpdateDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.updateStatus(id, statusUpdateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thanh toán', description: 'Xóa một thanh toán (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Thanh toán được xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thanh toán' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.paymentService.remove(id);
    return { message: 'Payment deleted successfully' };
  }
}

