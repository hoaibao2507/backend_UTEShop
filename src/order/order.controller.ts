import { Controller, Get, Post, Put, Delete, Patch ,Body, Param, Query, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderDto, OrderQueryDto } from './dto/order.dto';
import { OrderStatus } from '../entities/order-status.enum';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo đơn hàng mới', description: 'Tạo một đơn hàng mới từ giỏ hàng (yêu cầu xác thực)' })
    @ApiResponse({ status: 201, description: 'Đơn hàng được tạo thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async create(@Body() createOrderDto: CreateOrderDto) {
        return this.orderService.create(createOrderDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách đơn hàng', description: 'Lấy danh sách tất cả đơn hàng với phân trang và bộ lọc (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Danh sách đơn hàng được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async findAll(@Query() query: OrderQueryDto) {
        return this.orderService.findAll(query);
    }

    @Get('statistics')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy thống kê đơn hàng', description: 'Lấy thống kê tổng quan về đơn hàng (số lượng, doanh thu, trạng thái) (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Thống kê đơn hàng được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async getOrderStatistics() {
        return this.orderService.getOrderStatistics();
    }

    @Get('status/:status')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy đơn hàng theo trạng thái', description: 'Lấy danh sách đơn hàng theo trạng thái cụ thể (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Danh sách đơn hàng theo trạng thái được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async getOrdersByStatus(@Param('status') status: OrderStatus, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.orderService.getOrdersByStatus(status, page, limit);
    }

    @Get('user/:userId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy đơn hàng theo người dùng', description: 'Lấy danh sách đơn hàng của một người dùng cụ thể (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Danh sách đơn hàng của người dùng được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
    async findByUserId(@Param('userId') userId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.orderService.findByUserId(+userId, page, limit);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy chi tiết đơn hàng', description: 'Lấy thông tin chi tiết của một đơn hàng theo ID (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Thông tin đơn hàng được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
    async findOne(@Param('id') id: string) {
        return this.orderService.findOne(+id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật đơn hàng', description: 'Cập nhật thông tin của một đơn hàng (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Đơn hàng được cập nhật thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
    async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
        return this.orderService.update(+id, updateOrderDto);
    }

    @Put(':id/status')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng', description: 'Cập nhật trạng thái của một đơn hàng (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Trạng thái đơn hàng được cập nhật thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
    async updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
        return this.orderService.updateStatus(+id, status);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa đơn hàng', description: 'Xóa một đơn hàng khỏi hệ thống (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Đơn hàng được xóa thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
    async remove(@Param('id') id: string) {
        return this.orderService.remove(+id);
    }

    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Hủy đơn hàng (User)' })
    async cancelOrder(@Param('id') id: string) {
    return this.orderService.cancelOrder(+id);
  }
}
