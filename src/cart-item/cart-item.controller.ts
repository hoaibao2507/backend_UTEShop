import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CartItemService } from './cart-item.service';
import { CreateCartItemDto, UpdateCartItemDto } from './dto/cart-item.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('cart-items')
@Controller('cart-items')
export class CartItemController {
    constructor(private readonly cartItemService: CartItemService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng', description: 'Thêm một sản phẩm vào giỏ hàng với số lượng cụ thể (yêu cầu xác thực)' })
    @ApiResponse({ status: 201, description: 'Sản phẩm được thêm vào giỏ hàng thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async create(@Body() createCartItemDto: CreateCartItemDto) {
        return this.cartItemService.create(createCartItemDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách mục giỏ hàng', description: 'Lấy danh sách tất cả mục trong giỏ hàng với phân trang (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Danh sách mục giỏ hàng được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.cartItemService.findAll(page, limit);
    }

    @Get('cart/:cartId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy mục giỏ hàng theo ID giỏ hàng', description: 'Lấy tất cả sản phẩm trong một giỏ hàng cụ thể (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Danh sách mục giỏ hàng được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy giỏ hàng' })
    async findByCartId(@Param('cartId') cartId: string) {
        return this.cartItemService.findByCartId(+cartId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy chi tiết mục giỏ hàng', description: 'Lấy thông tin chi tiết của một mục trong giỏ hàng (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Thông tin mục giỏ hàng được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy mục giỏ hàng' })
    async findOne(@Param('id') id: string) {
        return this.cartItemService.findOne(+id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật mục giỏ hàng', description: 'Cập nhật thông tin của một mục trong giỏ hàng (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Mục giỏ hàng được cập nhật thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy mục giỏ hàng' })
    async update(@Param('id') id: string, @Body() updateCartItemDto: UpdateCartItemDto) {
        return this.cartItemService.update(+id, updateCartItemDto);
    }

    @Put(':id/quantity')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật số lượng sản phẩm', description: 'Cập nhật số lượng của một sản phẩm trong giỏ hàng (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Số lượng sản phẩm được cập nhật thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy mục giỏ hàng' })
    async updateQuantity(@Param('id') id: string, @Body('quantity') quantity: number) {
        return this.cartItemService.updateQuantity(+id, quantity);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa mục giỏ hàng', description: 'Xóa một sản phẩm khỏi giỏ hàng (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Mục giỏ hàng được xóa thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy mục giỏ hàng' })
    async remove(@Param('id') id: string) {
        return this.cartItemService.remove(+id);
    }

    @Delete('cart/:cartId/product/:productId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa sản phẩm khỏi giỏ hàng', description: 'Xóa một sản phẩm cụ thể khỏi giỏ hàng theo ID giỏ hàng và ID sản phẩm (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Sản phẩm được xóa khỏi giỏ hàng thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm trong giỏ hàng' })
    async removeByCartAndProduct(@Param('cartId') cartId: string, @Param('productId') productId: string) {
        return this.cartItemService.removeByCartAndProduct(+cartId, +productId);
    }

    @Delete('cart/:cartId/clear')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa tất cả sản phẩm trong giỏ hàng', description: 'Xóa tất cả sản phẩm khỏi một giỏ hàng cụ thể (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Tất cả sản phẩm được xóa khỏi giỏ hàng thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy giỏ hàng' })
    async clearCartItems(@Param('cartId') cartId: string) {
        return this.cartItemService.clearCartItems(+cartId);
    }
}
