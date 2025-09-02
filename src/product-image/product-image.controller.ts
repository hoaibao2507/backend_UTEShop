import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductImageService } from './product-image.service';
import { CreateProductImageDto, UpdateProductImageDto } from './dto/product-image.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('product-images')
export class ProductImageController {
    constructor(private readonly productImageService: ProductImageService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body() createProductImageDto: CreateProductImageDto) {
        return this.productImageService.create(createProductImageDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.productImageService.findAll(page, limit);
    }

    @Get('product/:productId')
    async findByProductId(@Param('productId') productId: string) {
        return this.productImageService.findByProductId(+productId);
    }

    @Get('product/:productId/primary')
    async findPrimaryByProductId(@Param('productId') productId: string) {
        return this.productImageService.findPrimaryByProductId(+productId);
    }

    @Get('product/:productId/count')
    async getImageCountByProduct(@Param('productId') productId: string) {
        const count = await this.productImageService.getImageCountByProduct(+productId);
        return { productId: +productId, imageCount: count };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.productImageService.findOne(+id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body() updateProductImageDto: UpdateProductImageDto) {
        return this.productImageService.update(+id, updateProductImageDto);
    }

    @Put(':id/set-primary')
    @UseGuards(JwtAuthGuard)
    async setPrimaryImage(@Param('id') id: string) {
        return this.productImageService.setPrimaryImage(+id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(@Param('id') id: string) {
        return this.productImageService.remove(+id);
    }

    @Delete('product/:productId')
    @UseGuards(JwtAuthGuard)
    async removeByProductId(@Param('productId') productId: string) {
        return this.productImageService.removeByProductId(+productId);
    }
}
