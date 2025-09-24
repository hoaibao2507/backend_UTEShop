import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProductViewService } from './product-view.service';
import { CreateProductViewDto, ProductViewQueryDto } from './dto/product-view.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('product-views')
export class ProductViewController {
    constructor(private readonly productViewService: ProductViewService) {}

    // Vô hiệu hóa endpoint cũ để tránh duplicate tracking
    // @Post()
    // async create(@Body() createProductViewDto: CreateProductViewDto) {
    //     return this.productViewService.create(createProductViewDto);
    // }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Query() query: ProductViewQueryDto) {
        return this.productViewService.findAll(query);
    }

    @Get('most-viewed')
    async getMostViewedProducts(@Query('limit') limit: number = 10) {
        return this.productViewService.getMostViewedProducts(limit);
    }

    @Get('recent')
    @UseGuards(JwtAuthGuard)
    async getRecentViews(@Query('limit') limit: number = 10) {
        return this.productViewService.getRecentViews(limit);
    }

    @Get('product/:productId')
    @UseGuards(JwtAuthGuard)
    async findByProductId(@Param('productId') productId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.productViewService.findByProductId(+productId, page, limit);
    }

    @Get('product/:productId/count')
    async getProductViewCount(@Param('productId') productId: string) {
        const count = await this.productViewService.getProductViewCount(+productId);
        return { productId: +productId, viewCount: count };
    }

    @Get('user/:userId')
    @UseGuards(JwtAuthGuard)
    async findByUserId(@Param('userId') userId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.productViewService.findByUserId(+userId, page, limit);
    }

    @Get('user/:userId/history')
    @UseGuards(JwtAuthGuard)
    async getUserViewHistory(@Param('userId') userId: string, @Query('limit') limit: number = 10) {
        return this.productViewService.getUserViewHistory(+userId, limit);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string) {
        return this.productViewService.findOne(+id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(@Param('id') id: string) {
        return this.productViewService.remove(+id);
    }

    @Delete('product/:productId')
    @UseGuards(JwtAuthGuard)
    async removeByProductId(@Param('productId') productId: string) {
        return this.productViewService.removeByProductId(+productId);
    }

    @Delete('user/:userId')
    @UseGuards(JwtAuthGuard)
    async removeByUserId(@Param('userId') userId: string) {
        return this.productViewService.removeByUserId(+userId);
    }

    /**
     * Xóa tất cả product views (để test)
     */
    @Delete('clear-all')
    @UseGuards(JwtAuthGuard)
    async clearAllViews() {
        return this.productViewService.clearAllViews();
    }

    /**
     * Track lượt xem sản phẩm - 1 user = 1 lượt xem mỗi ngày
     */
    @Post('track/:productId')
    @UseGuards(JwtAuthGuard)
    async trackProductView(@Param('productId') productId: string, @Request() req) {
        const userId = req.user.id; // Lấy user ID từ JWT token
        return this.productViewService.trackView(userId, +productId);
    }
}
