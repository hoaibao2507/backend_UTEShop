import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body() createProductDto: CreateProductDto) {
        return this.productService.create(createProductDto);
    }

    @Get()
    async findAll(@Query() query: ProductQueryDto) {
        return this.productService.findAll(query);
    }

    @Get('featured')
    async getFeaturedProducts(@Query('limit') limit: number = 10) {
        return this.productService.getFeaturedProducts(limit);
    }

    @Get('category/:categoryId')
    async getProductsByCategory(@Param('categoryId') categoryId: string, @Query('limit') limit: number = 10) {
        return this.productService.getProductsByCategory(+categoryId, limit);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.productService.findOne(+id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
        return this.productService.update(+id, updateProductDto);
    }

    @Put(':id/stock')
    @UseGuards(JwtAuthGuard)
    async updateStock(@Param('id') id: string, @Body('quantity') quantity: number) {
        return this.productService.updateStock(+id, quantity);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(@Param('id') id: string) {
        return this.productService.remove(+id);
    }
}
