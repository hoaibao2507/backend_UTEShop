import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductReviewService } from './product-review.service';
import { CreateProductReviewDto, UpdateProductReviewDto, ProductReviewQueryDto } from './dto/product-review.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('product-reviews')
@Controller('product-reviews')
export class ProductReviewController {
    constructor(private readonly productReviewService: ProductReviewService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo đánh giá sản phẩm mới', description: 'Tạo một đánh giá mới cho sản phẩm (yêu cầu xác thực)' })
    @ApiResponse({ status: 201, description: 'Đánh giá sản phẩm được tạo thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async create(@Body() createProductReviewDto: CreateProductReviewDto) {
        return this.productReviewService.create(createProductReviewDto);
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách đánh giá sản phẩm', description: 'Lấy danh sách tất cả đánh giá sản phẩm với phân trang và bộ lọc' })
    @ApiResponse({ status: 200, description: 'Danh sách đánh giá sản phẩm được trả về thành công' })
    async findAll(@Query() query: ProductReviewQueryDto) {
        return this.productReviewService.findAll(query);
    }

    @Get('product/:productId')
    @ApiOperation({ summary: 'Lấy đánh giá theo sản phẩm', description: 'Lấy danh sách đánh giá của một sản phẩm cụ thể với phân trang' })
    @ApiResponse({ status: 200, description: 'Danh sách đánh giá sản phẩm được trả về thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async findByProductId(@Param('productId') productId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.productReviewService.findByProductId(+productId, page, limit);
    }

    @Get('product/:productId/rating-stats')
    @ApiOperation({ summary: 'Lấy thống kê đánh giá sản phẩm', description: 'Lấy thống kê đánh giá (điểm trung bình, số lượng đánh giá) của một sản phẩm' })
    @ApiResponse({ status: 200, description: 'Thống kê đánh giá sản phẩm được trả về thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async getProductRatingStats(@Param('productId') productId: string) {
        return this.productReviewService.getProductRatingStats(+productId);
    }

    @Get('stats/:productId')
    @ApiOperation({ summary: 'Lấy thống kê đánh giá sản phẩm (alias)', description: 'Alias cho endpoint rating-stats, lấy thống kê đánh giá của một sản phẩm' })
    @ApiResponse({ status: 200, description: 'Thống kê đánh giá sản phẩm được trả về thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async getProductStats(@Param('productId') productId: string) {
        return this.productReviewService.getProductRatingStats(+productId);
    }

    @Get('user/:userId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy đánh giá theo người dùng', description: 'Lấy danh sách đánh giá của một người dùng cụ thể (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Danh sách đánh giá của người dùng được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
    async findByUserId(@Param('userId') userId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.productReviewService.findByUserId(+userId, page, limit);
    }

    @Get('user/:userId/product/:productId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy đánh giá của người dùng cho sản phẩm', description: 'Lấy đánh giá cụ thể của một người dùng cho một sản phẩm (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Đánh giá của người dùng cho sản phẩm được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy đánh giá' })
    async getUserReviewForProduct(@Param('userId') userId: string, @Param('productId') productId: string) {
        return this.productReviewService.getUserReviewForProduct(+userId, +productId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy chi tiết đánh giá sản phẩm', description: 'Lấy thông tin chi tiết của một đánh giá sản phẩm theo ID' })
    @ApiResponse({ status: 200, description: 'Thông tin đánh giá sản phẩm được trả về thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy đánh giá' })
    async findOne(@Param('id') id: string) {
        return this.productReviewService.findOne(+id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật đánh giá sản phẩm', description: 'Cập nhật thông tin của một đánh giá sản phẩm (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Đánh giá sản phẩm được cập nhật thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy đánh giá' })
    async update(@Param('id') id: string, @Body() updateProductReviewDto: UpdateProductReviewDto) {
        return this.productReviewService.update(+id, updateProductReviewDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa đánh giá sản phẩm', description: 'Xóa một đánh giá sản phẩm khỏi hệ thống (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Đánh giá sản phẩm được xóa thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy đánh giá' })
    async remove(@Param('id') id: string) {
        return this.productReviewService.remove(+id);
    }
}
