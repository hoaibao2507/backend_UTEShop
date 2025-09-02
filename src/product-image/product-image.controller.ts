import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductImageService } from './product-image.service';
import { CreateProductImageDto, UpdateProductImageDto } from './dto/product-image.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('product-images')
@Controller('product-images')
export class ProductImageController {
    constructor(private readonly productImageService: ProductImageService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo hình ảnh sản phẩm mới', description: 'Tạo một hình ảnh mới cho sản phẩm (yêu cầu xác thực)' })
    @ApiResponse({ status: 201, description: 'Hình ảnh sản phẩm được tạo thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async create(@Body() createProductImageDto: CreateProductImageDto) {
        return this.productImageService.create(createProductImageDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách hình ảnh sản phẩm', description: 'Lấy danh sách tất cả hình ảnh sản phẩm với phân trang (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Danh sách hình ảnh sản phẩm được trả về thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.productImageService.findAll(page, limit);
    }

    @Get('product/:productId')
    @ApiOperation({ summary: 'Lấy hình ảnh theo sản phẩm', description: 'Lấy danh sách tất cả hình ảnh của một sản phẩm cụ thể' })
    @ApiResponse({ status: 200, description: 'Danh sách hình ảnh sản phẩm được trả về thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async findByProductId(@Param('productId') productId: string) {
        return this.productImageService.findByProductId(+productId);
    }

    @Get('product/:productId/primary')
    @ApiOperation({ summary: 'Lấy hình ảnh chính của sản phẩm', description: 'Lấy hình ảnh chính (primary) của một sản phẩm cụ thể' })
    @ApiResponse({ status: 200, description: 'Hình ảnh chính của sản phẩm được trả về thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm hoặc hình ảnh chính' })
    async findPrimaryByProductId(@Param('productId') productId: string) {
        return this.productImageService.findPrimaryByProductId(+productId);
    }

    @Get('product/:productId/count')
    @ApiOperation({ summary: 'Lấy số lượng hình ảnh của sản phẩm', description: 'Lấy tổng số lượng hình ảnh của một sản phẩm cụ thể' })
    @ApiResponse({ status: 200, description: 'Số lượng hình ảnh của sản phẩm được trả về thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async getImageCountByProduct(@Param('productId') productId: string) {
        const count = await this.productImageService.getImageCountByProduct(+productId);
        return { productId: +productId, imageCount: count };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy chi tiết hình ảnh sản phẩm', description: 'Lấy thông tin chi tiết của một hình ảnh sản phẩm theo ID' })
    @ApiResponse({ status: 200, description: 'Thông tin hình ảnh sản phẩm được trả về thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy hình ảnh' })
    async findOne(@Param('id') id: string) {
        return this.productImageService.findOne(+id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật hình ảnh sản phẩm', description: 'Cập nhật thông tin của một hình ảnh sản phẩm (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Hình ảnh sản phẩm được cập nhật thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy hình ảnh' })
    async update(@Param('id') id: string, @Body() updateProductImageDto: UpdateProductImageDto) {
        return this.productImageService.update(+id, updateProductImageDto);
    }

    @Put(':id/set-primary')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Đặt hình ảnh làm chính', description: 'Đặt một hình ảnh làm hình ảnh chính của sản phẩm (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Hình ảnh được đặt làm chính thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy hình ảnh' })
    async setPrimaryImage(@Param('id') id: string) {
        return this.productImageService.setPrimaryImage(+id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa hình ảnh sản phẩm', description: 'Xóa một hình ảnh sản phẩm khỏi hệ thống (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Hình ảnh sản phẩm được xóa thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy hình ảnh' })
    async remove(@Param('id') id: string) {
        return this.productImageService.remove(+id);
    }

    @Delete('product/:productId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa tất cả hình ảnh của sản phẩm', description: 'Xóa tất cả hình ảnh của một sản phẩm cụ thể (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Tất cả hình ảnh của sản phẩm được xóa thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async removeByProductId(@Param('productId') productId: string) {
        return this.productImageService.removeByProductId(+productId);
    }
}
