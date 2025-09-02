import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('products')
@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo sản phẩm mới', description: 'Tạo một sản phẩm mới trong hệ thống (yêu cầu xác thực)' })
    @ApiResponse({ status: 201, description: 'Sản phẩm được tạo thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async create(@Body() createProductDto: CreateProductDto) {
        return this.productService.create(createProductDto);
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách sản phẩm', description: 'Lấy danh sách tất cả sản phẩm với phân trang và bộ lọc' })
    @ApiResponse({ status: 200, description: 'Danh sách sản phẩm được trả về thành công' })
    async findAll(@Query() query: ProductQueryDto) {
        return this.productService.findAll(query);
    }

    @Get('featured')
    @ApiOperation({ summary: 'Lấy sản phẩm nổi bật', description: 'Lấy danh sách các sản phẩm nổi bật (có giảm giá cao nhất)' })
    @ApiResponse({ status: 200, description: 'Danh sách sản phẩm nổi bật được trả về thành công' })
    async getFeaturedProducts(@Query('limit') limit: number = 10) {
        return this.productService.getFeaturedProducts(limit);
    }

    @Get('category/:categoryId')
    @ApiOperation({ summary: 'Lấy sản phẩm theo danh mục', description: 'Lấy danh sách sản phẩm thuộc một danh mục cụ thể' })
    @ApiResponse({ status: 200, description: 'Danh sách sản phẩm theo danh mục được trả về thành công' })
    async getProductsByCategory(@Param('categoryId') categoryId: string, @Query('limit') limit: number = 10) {
        return this.productService.getProductsByCategory(+categoryId, limit);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy chi tiết sản phẩm', description: 'Lấy thông tin chi tiết của một sản phẩm theo ID' })
    @ApiResponse({ status: 200, description: 'Thông tin sản phẩm được trả về thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async findOne(@Param('id') id: string) {
        return this.productService.findOne(+id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật sản phẩm', description: 'Cập nhật thông tin của một sản phẩm (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Sản phẩm được cập nhật thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
        return this.productService.update(+id, updateProductDto);
    }

    @Put(':id/stock')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật số lượng tồn kho', description: 'Cập nhật số lượng tồn kho của sản phẩm (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Số lượng tồn kho được cập nhật thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async updateStock(@Param('id') id: string, @Body('quantity') quantity: number) {
        return this.productService.updateStock(+id, quantity);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa sản phẩm', description: 'Xóa một sản phẩm khỏi hệ thống (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Sản phẩm được xóa thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async remove(@Param('id') id: string) {
        return this.productService.remove(+id);
    }
}
