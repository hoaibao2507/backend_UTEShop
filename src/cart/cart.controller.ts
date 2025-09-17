import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto, UpdateCartDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('carts')
@Controller('carts')
export class CartController {
    constructor(private readonly cartService: CartService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo giỏ hàng mới', description: 'Tạo một giỏ hàng mới cho người dùng (yêu cầu xác thực)' })
    @ApiResponse({ status: 201, description: 'Giỏ hàng được tạo thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async create(@Body() createCartDto: CreateCartDto) {
        return this.cartService.create(createCartDto);
    }

    @Get('user/:userId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy giỏ hàng theo người dùng', description: 'Lấy giỏ hàng của một người dùng cụ thể (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Giỏ hàng của người dùng được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy giỏ hàng' })
    async findByUserId(@Param('userId') userId: string) {
        return this.cartService.findByUserId(+userId);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách giỏ hàng', description: 'Lấy danh sách tất cả giỏ hàng với phân trang (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Danh sách giỏ hàng được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.cartService.findAll(page, limit);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy chi tiết giỏ hàng', description: 'Lấy thông tin chi tiết của một giỏ hàng theo ID (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Thông tin giỏ hàng được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy giỏ hàng' })
    async findOne(@Param('id') id: string) {
        return this.cartService.findOne(+id);
    }

    @Get(':id/summary')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy tóm tắt giỏ hàng', description: 'Lấy thông tin tóm tắt của giỏ hàng (tổng tiền, số lượng sản phẩm) (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Tóm tắt giỏ hàng được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy giỏ hàng' })
    async getCartSummary(@Param('id') id: string) {
        return this.cartService.getCartSummary(+id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật giỏ hàng', description: 'Cập nhật thông tin của một giỏ hàng (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Giỏ hàng được cập nhật thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy giỏ hàng' })
    async update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
        return this.cartService.update(+id, updateCartDto);
    }

    @Put(':id/clear')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa tất cả sản phẩm trong giỏ hàng', description: 'Xóa tất cả sản phẩm khỏi giỏ hàng (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Giỏ hàng được xóa sạch thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy giỏ hàng' })
    async clearCart(@Param('id') id: string) {
        return this.cartService.clearCart(+id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa giỏ hàng', description: 'Xóa một giỏ hàng khỏi hệ thống (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Giỏ hàng được xóa thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy giỏ hàng' })
    async remove(@Param('id') id: string) {
        return this.cartService.remove(+id);
    }
}
