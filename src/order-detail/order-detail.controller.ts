import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { OrderDetailService } from './order-detail.service';
import { CreateOrderDetailDto, UpdateOrderDetailDto } from './dto/order-detail.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('order-details')
@Controller('order-details')
export class OrderDetailController {
    constructor(private readonly orderDetailService: OrderDetailService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo chi tiết đơn hàng mới', description: 'Tạo một chi tiết đơn hàng mới (sản phẩm trong đơn hàng) (yêu cầu xác thực)' })
    @ApiResponse({ status: 201, description: 'Chi tiết đơn hàng được tạo thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async create(@Body() createOrderDetailDto: CreateOrderDetailDto) {
        return this.orderDetailService.create(createOrderDetailDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách chi tiết đơn hàng', description: 'Lấy danh sách tất cả chi tiết đơn hàng với phân trang (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Danh sách chi tiết đơn hàng được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.orderDetailService.findAll(page, limit);
    }

    @Get('order/:orderId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy chi tiết đơn hàng theo ID đơn hàng', description: 'Lấy tất cả sản phẩm trong một đơn hàng cụ thể (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Chi tiết đơn hàng được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
    async findByOrderId(@Param('orderId') orderId: string) {
        return this.orderDetailService.findByOrderId(+orderId);
    }

    @Get('order/:orderId/total')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy tổng tiền đơn hàng', description: 'Lấy tổng tiền của một đơn hàng cụ thể (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Tổng tiền đơn hàng được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
    async getOrderTotal(@Param('orderId') orderId: string) {
        const total = await this.orderDetailService.getOrderTotal(+orderId);
        return { orderId: +orderId, total };
    }

    @Get('product/:productId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy chi tiết đơn hàng theo sản phẩm', description: 'Lấy danh sách đơn hàng chứa một sản phẩm cụ thể (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Danh sách chi tiết đơn hàng theo sản phẩm được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async findByProductId(@Param('productId') productId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.orderDetailService.findByProductId(+productId, page, limit);
    }

    @Get('product/:productId/sales')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy thống kê bán hàng của sản phẩm', description: 'Lấy thống kê bán hàng (số lượng, doanh thu) của một sản phẩm (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Thống kê bán hàng của sản phẩm được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async getProductSales(@Param('productId') productId: string) {
        return this.orderDetailService.getProductSales(+productId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy chi tiết đơn hàng theo ID', description: 'Lấy thông tin chi tiết của một mục trong đơn hàng (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Thông tin chi tiết đơn hàng được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy chi tiết đơn hàng' })
    async findOne(@Param('id') id: string) {
        return this.orderDetailService.findOne(+id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật chi tiết đơn hàng', description: 'Cập nhật thông tin của một mục trong đơn hàng (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Chi tiết đơn hàng được cập nhật thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy chi tiết đơn hàng' })
    async update(@Param('id') id: string, @Body() updateOrderDetailDto: UpdateOrderDetailDto) {
        return this.orderDetailService.update(+id, updateOrderDetailDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa chi tiết đơn hàng', description: 'Xóa một sản phẩm khỏi đơn hàng (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Chi tiết đơn hàng được xóa thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy chi tiết đơn hàng' })
    async remove(@Param('id') id: string) {
        return this.orderDetailService.remove(+id);
    }

    @Delete('order/:orderId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa tất cả chi tiết đơn hàng', description: 'Xóa tất cả sản phẩm khỏi một đơn hàng cụ thể (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Tất cả chi tiết đơn hàng được xóa thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
    async removeByOrderId(@Param('orderId') orderId: string) {
        return this.orderDetailService.removeByOrderId(+orderId);
    }
}
