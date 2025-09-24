import { Controller, Post, Body, Get, Param, Patch, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrderPaymentService } from './order-payment.service';
import type { CreateOrderWithPaymentDto, OrderSummary } from './order-payment.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@ApiTags('Order Payment')
@Controller('orders/payment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderPaymentController {
  constructor(private readonly orderPaymentService: OrderPaymentService) {}

  @Post('create')
  @ApiOperation({ summary: 'Tạo đơn hàng với thanh toán', description: 'Tạo đơn hàng mới với tích hợp thanh toán (yêu cầu xác thực)' })
  @ApiResponse({ status: 201, description: 'Đơn hàng được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy giỏ hàng hoặc phương thức thanh toán' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async createOrderWithPayment(@Body() createOrderDto: CreateOrderWithPaymentDto): Promise<OrderSummary> {
    return this.orderPaymentService.createOrderWithPayment(createOrderDto);
  }

  @Post(':orderId/cod/process')
  @ApiOperation({ summary: 'Xử lý thanh toán COD', description: 'Xác nhận thanh toán COD khi giao hàng thành công (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Thanh toán COD được xử lý thành công' })
  @ApiResponse({ status: 400, description: 'Đơn hàng không sử dụng COD' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async processCODPayment(@Param('orderId', ParseIntPipe) orderId: number) {
    const order = await this.orderPaymentService.processCODPayment(orderId);
    return {
      message: 'COD payment processed successfully',
      order,
    };
  }

  @Patch(':orderId/cancel')
  @ApiOperation({ summary: 'Hủy đơn hàng', description: 'Hủy đơn hàng và hoàn trả tồn kho (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Đơn hàng được hủy thành công' })
  @ApiResponse({ status: 400, description: 'Không thể hủy đơn hàng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async cancelOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body('reason') reason?: string,
  ) {
    const order = await this.orderPaymentService.cancelOrder(orderId, reason);
    return {
      message: 'Order cancelled successfully',
      order,
    };
  }

  @Get(':orderId/details')
  @ApiOperation({ summary: 'Lấy chi tiết đơn hàng với thanh toán', description: 'Lấy thông tin chi tiết đơn hàng bao gồm thanh toán (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Thông tin đơn hàng được trả về thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getOrderWithPayment(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.orderPaymentService.getOrderWithPayment(orderId);
  }
}
