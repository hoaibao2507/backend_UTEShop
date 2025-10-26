import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, LatestProductsQueryDto, BestSellingProductsQueryDto, MostViewedProductsQueryDto, TopDiscountProductsQueryDto, HomepageProductQueryDto, CreateProductWithImagesDto, UpdateProductWithImagesDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('products')
@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Post('with-images')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Tạo sản phẩm mới với ảnh', 
        description: 'Tạo một sản phẩm mới kèm upload ảnh lên Cloudinary (yêu cầu xác thực)' 
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                productName: { type: 'string', example: 'Áo thun UTEShop' },
                description: { type: 'string', example: 'Áo thun chất lượng cao' },
                price: { type: 'number', example: 150000 },
                discountPercent: { type: 'number', example: 10 },
                stockQuantity: { type: 'number', example: 100 },
                categoryId: { type: 'number', example: 1 },
                images: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Danh sách ảnh sản phẩm'
                },
                primaryImageIndex: { type: 'string', example: '0', description: 'Index của ảnh chính' }
            },
            required: ['productName', 'price', 'categoryId', 'images']
        }
    })
    @ApiResponse({ status: 201, description: 'Sản phẩm được tạo thành công với ảnh' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    async createWithImages(
        @UploadedFiles() images: Express.Multer.File[],
        @Body() createProductWithImagesDto: CreateProductWithImagesDto
    ) {
        return this.productService.createWithImages(createProductWithImagesDto, images);
    }

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

    @Get('search')
    @ApiOperation({ summary: 'Tìm kiếm sản phẩm', description: 'Tìm kiếm sản phẩm theo từ khóa và lọc theo danh mục' })
    @ApiQuery({ name: 'q', required: true, description: 'Từ khóa tìm kiếm' })
    @ApiQuery({ name: 'categoryId', required: false, description: 'Lọc theo danh mục' })
    @ApiQuery({ name: 'page', required: false, description: 'Số trang (mặc định: 1)' })
    @ApiQuery({ name: 'limit', required: false, description: 'Số lượng sản phẩm mỗi trang (mặc định: 10)' })
    @ApiResponse({ status: 200, description: 'Kết quả tìm kiếm' })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    async searchProducts(
        @Query('q') query: string,
        @Query('categoryId') categoryId?: number,
        @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
        @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    ) {
        // Validate query parameter
        if (!query || query.trim().length === 0) {
            throw new BadRequestException('Query parameter "q" is required and cannot be empty');
        }

        return this.productService.searchProducts(query.trim(), categoryId, page, limit);
    }

    @Get('latest')
    @ApiOperation({ summary: 'Lấy sản phẩm mới nhất', description: 'Lấy danh sách sản phẩm mới nhất cho trang chủ (có thể tùy chỉnh số lượng)' })
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

    @Get(':id/similar')
    @ApiOperation({ 
        summary: 'Lấy sản phẩm tương tự', 
        description: 'Lấy danh sách sản phẩm tương tự với sản phẩm hiện tại (dựa trên category và giá)' 
    })
    @ApiQuery({ 
        name: 'limit', 
        required: false, 
        type: 'number', 
        description: 'Số lượng sản phẩm tương tự (mặc định: 6)',
        example: 6
    })
    @ApiResponse({ status: 200, description: 'Danh sách sản phẩm tương tự được trả về thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async getSimilarProducts(@Param('id') id: string, @Query('limit') limit: number = 6) {
        return this.productService.getSimilarProducts(+id, limit);
    }

    @Get(':id/stats')
    @ApiOperation({ 
        summary: 'Lấy thống kê tổng quan sản phẩm', 
        description: 'Lấy thống kê chi tiết về sản phẩm: số lượt xem, đánh giá, mua hàng, yêu thích' 
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Thống kê sản phẩm được trả về thành công',
        schema: {
            type: 'object',
            properties: {
                productId: { type: 'number' },
                totalViews: { type: 'number' },
                totalReviews: { type: 'number' },
                totalPurchases: { type: 'number' },
                totalWishlists: { type: 'number' },
                averageRating: { type: 'number' },
                ratingDistribution: {
                    type: 'object',
                    properties: {
                        1: { type: 'number' },
                        2: { type: 'number' },
                        3: { type: 'number' },
                        4: { type: 'number' },
                        5: { type: 'number' }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async getProductStats(@Param('id') id: string) {
        return this.productService.getProductStats(+id);
    }

    @Get('category/:categoryId')
    @ApiOperation({ summary: 'Lấy sản phẩm theo danh mục', description: 'Lấy danh sách sản phẩm thuộc một danh mục cụ thể' })
    @ApiResponse({ status: 200, description: 'Danh sách sản phẩm theo danh mục được trả về thành công' })
    async getProductsByCategory(@Param('categoryId') categoryId: string, @Query('limit') limit: number = 10) {
        return this.productService.getProductsByCategory(+categoryId, limit);
    }

    @Get('by-slug/:slug')
    @ApiOperation({ summary: 'Lấy sản phẩm theo slug', description: 'Lấy thông tin chi tiết của một sản phẩm theo slug' })
    @ApiResponse({ status: 200, description: 'Thông tin sản phẩm được trả về thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async findBySlug(@Param('slug') slug: string) {
        return this.productService.findOne(slug);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy chi tiết sản phẩm', description: 'Lấy thông tin chi tiết của một sản phẩm theo ID hoặc slug' })
    @ApiResponse({ status: 200, description: 'Thông tin sản phẩm được trả về thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async findOne(@Param('id') idOrSlug: string) {
        // Try to parse as number, if not parseable, treat as slug
        const parsedId = parseInt(idOrSlug, 10);
        const isNumeric = !isNaN(parsedId) && parsedId.toString() === idOrSlug;
        
        return this.productService.findOne(isNumeric ? parsedId : idOrSlug);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật sản phẩm', description: 'Cập nhật thông tin cơ bản của một sản phẩm (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Sản phẩm được cập nhật thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
        return this.productService.update(+id, updateProductDto);
    }

    @Put(':id/with-images')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Cập nhật sản phẩm với ảnh', 
        description: 'Cập nhật thông tin sản phẩm kèm upload ảnh mới lên Cloudinary (yêu cầu xác thực)' 
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                productName: { type: 'string', example: 'Áo thun UTEShop Updated' },
                description: { type: 'string', example: 'Áo thun chất lượng cao đã cập nhật' },
                price: { type: 'number', example: 180000 },
                discountPercent: { type: 'number', example: 15 },
                stockQuantity: { type: 'number', example: 150 },
                categoryId: { type: 'number', example: 3 },
                images: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Danh sách ảnh mới (sẽ thay thế ảnh cũ)'
                },
                primaryImageIndex: { type: 'string', example: '0', description: 'Index của ảnh chính' },
                keepExistingImages: { type: 'boolean', example: false, description: 'Giữ lại ảnh cũ hay không' }
            }
        }
    })
    @ApiResponse({ status: 200, description: 'Sản phẩm được cập nhật thành công với ảnh mới' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    async updateWithImages(
        @Param('id') id: string,
        @UploadedFiles() images: Express.Multer.File[],
        @Body() updateProductWithImagesDto: UpdateProductWithImagesDto
    ) {
        return this.productService.updateWithImages(+id, updateProductWithImagesDto, images);
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
