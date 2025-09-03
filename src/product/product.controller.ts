import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, LatestProductsQueryDto, BestSellingProductsQueryDto, MostViewedProductsQueryDto, TopDiscountProductsQueryDto, HomepageProductQueryDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

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

    @Get('latest')
    @ApiOperation({ 
        summary: 'Lấy sản phẩm mới nhất', 
        description: 'Lấy danh sách sản phẩm mới nhất cho trang chủ (có thể tùy chỉnh số lượng)' 
    })
    @ApiQuery({ 
        name: 'limit', 
        required: false, 
        type: 'number', 
        description: 'Số lượng sản phẩm cần lấy (mặc định: 10)',
        example: 10
    })
    @ApiResponse({ status: 200, description: 'Danh sách sản phẩm mới nhất được trả về thành công' })
    async getLatestProducts(@Query() query: LatestProductsQueryDto) {
        return this.productService.getLatestProducts(query.limit);
    }



    @Get('best-selling')
    @ApiOperation({ 
        summary: 'Lấy sản phẩm bán chạy nhất', 
        description: 'Lấy danh sách sản phẩm bán chạy nhất cho trang chủ (có thể tùy chỉnh số lượng)' 
    })
    @ApiQuery({ 
        name: 'limit', 
        required: false, 
        type: 'number', 
        description: 'Số lượng sản phẩm cần lấy (mặc định: 10)',
        example: 10
    })
    @ApiResponse({ status: 200, description: 'Danh sách sản phẩm bán chạy nhất được trả về thành công' })
    async getBestSellingProducts(@Query() query: BestSellingProductsQueryDto) {
        return this.productService.getBestSellingProducts(query.limit);
    }

    @Get('most-viewed')
    @ApiOperation({ 
        summary: 'Lấy sản phẩm được xem nhiều nhất', 
        description: 'Lấy danh sách sản phẩm được xem nhiều nhất cho trang chủ (có thể tùy chỉnh số lượng)' 
    })
    @ApiQuery({ 
        name: 'limit', 
        required: false, 
        type: 'number', 
        description: 'Số lượng sản phẩm cần lấy (mặc định: 10)',
        example: 10
    })
    @ApiResponse({ status: 200, description: 'Danh sách sản phẩm được xem nhiều nhất được trả về thành công' })
    async getMostViewedProducts(@Query() query: MostViewedProductsQueryDto) {
        return this.productService.getMostViewedProducts(query.limit);
    }

    @Get('top-discount')
    @ApiOperation({ 
        summary: 'Lấy sản phẩm khuyến mãi cao nhất', 
        description: 'Lấy danh sách sản phẩm có khuyến mãi cao nhất cho trang chủ (có thể tùy chỉnh số lượng)' 
    })
    @ApiQuery({ 
        name: 'limit', 
        required: false, 
        type: 'number', 
        description: 'Số lượng sản phẩm cần lấy (mặc định: 10)',
        example: 10
    })
    @ApiResponse({ status: 200, description: 'Danh sách sản phẩm khuyến mãi cao nhất được trả về thành công' })
    async getTopDiscountProducts(@Query() query: TopDiscountProductsQueryDto) {
        return this.productService.getTopDiscountProducts(query.limit);
    }

    @Get('homepage')
    @ApiOperation({ 
        summary: 'Lấy tất cả sản phẩm cho trang chủ', 
        description: 'Lấy tất cả các loại sản phẩm cho trang chủ trong một API call (có thể tùy chỉnh số lượng cho từng loại)' 
    })
    @ApiQuery({ 
        name: 'latestLimit', 
        required: false, 
        type: 'number', 
        description: 'Số lượng sản phẩm mới nhất (mặc định: 8)',
        example: 8
    })
    @ApiQuery({ 
        name: 'bestSellingLimit', 
        required: false, 
        type: 'number', 
        description: 'Số lượng sản phẩm bán chạy (mặc định: 6)',
        example: 6
    })
    @ApiQuery({ 
        name: 'mostViewedLimit', 
        required: false, 
        type: 'number', 
        description: 'Số lượng sản phẩm được xem nhiều (mặc định: 8)',
        example: 8
    })
    @ApiQuery({ 
        name: 'topDiscountLimit', 
        required: false, 
        type: 'number', 
        description: 'Số lượng sản phẩm khuyến mãi (mặc định: 4)',
        example: 4
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Tất cả sản phẩm cho trang chủ được trả về thành công',
        schema: {
            type: 'object',
            properties: {
                latestProducts: {
                    type: 'array',
                    description: 'Sản phẩm mới nhất'
                },
                bestSellingProducts: {
                    type: 'array',
                    description: 'Sản phẩm bán chạy nhất'
                },
                mostViewedProducts: {
                    type: 'array',
                    description: 'Sản phẩm được xem nhiều nhất'
                },
                topDiscountProducts: {
                    type: 'array',
                    description: 'Sản phẩm khuyến mãi cao nhất'
                }
            }
        }
    })
    async getHomepageProducts(@Query() query: HomepageProductQueryDto) {
        return this.productService.getHomepageProducts({
            latestLimit: query.latestLimit,
            bestSellingLimit: query.bestSellingLimit,
            mostViewedLimit: query.mostViewedLimit,
            topDiscountLimit: query.topDiscountLimit
        });
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
