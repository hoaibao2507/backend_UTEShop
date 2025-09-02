import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductReviewService } from './product-review.service';
import { CreateProductReviewDto, UpdateProductReviewDto, ProductReviewQueryDto } from './dto/product-review.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('product-reviews')
export class ProductReviewController {
    constructor(private readonly productReviewService: ProductReviewService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body() createProductReviewDto: CreateProductReviewDto) {
        return this.productReviewService.create(createProductReviewDto);
    }

    @Get()
    async findAll(@Query() query: ProductReviewQueryDto) {
        return this.productReviewService.findAll(query);
    }

    @Get('product/:productId')
    async findByProductId(@Param('productId') productId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.productReviewService.findByProductId(+productId, page, limit);
    }

    @Get('product/:productId/rating-stats')
    async getProductRatingStats(@Param('productId') productId: string) {
        return this.productReviewService.getProductRatingStats(+productId);
    }

    @Get('user/:userId')
    @UseGuards(JwtAuthGuard)
    async findByUserId(@Param('userId') userId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.productReviewService.findByUserId(+userId, page, limit);
    }

    @Get('user/:userId/product/:productId')
    @UseGuards(JwtAuthGuard)
    async getUserReviewForProduct(@Param('userId') userId: string, @Param('productId') productId: string) {
        return this.productReviewService.getUserReviewForProduct(+userId, +productId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.productReviewService.findOne(+id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body() updateProductReviewDto: UpdateProductReviewDto) {
        return this.productReviewService.update(+id, updateProductReviewDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(@Param('id') id: string) {
        return this.productReviewService.remove(+id);
    }
}
