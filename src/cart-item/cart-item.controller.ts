import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CartItemService } from './cart-item.service';
import { CreateCartItemDto, UpdateCartItemDto } from './dto/cart-item.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('cart-items')
export class CartItemController {
    constructor(private readonly cartItemService: CartItemService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body() createCartItemDto: CreateCartItemDto) {
        return this.cartItemService.create(createCartItemDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.cartItemService.findAll(page, limit);
    }

    @Get('cart/:cartId')
    @UseGuards(JwtAuthGuard)
    async findByCartId(@Param('cartId') cartId: string) {
        return this.cartItemService.findByCartId(+cartId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string) {
        return this.cartItemService.findOne(+id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body() updateCartItemDto: UpdateCartItemDto) {
        return this.cartItemService.update(+id, updateCartItemDto);
    }

    @Put(':id/quantity')
    @UseGuards(JwtAuthGuard)
    async updateQuantity(@Param('id') id: string, @Body('quantity') quantity: number) {
        return this.cartItemService.updateQuantity(+id, quantity);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(@Param('id') id: string) {
        return this.cartItemService.remove(+id);
    }

    @Delete('cart/:cartId/product/:productId')
    @UseGuards(JwtAuthGuard)
    async removeByCartAndProduct(@Param('cartId') cartId: string, @Param('productId') productId: string) {
        return this.cartItemService.removeByCartAndProduct(+cartId, +productId);
    }

    @Delete('cart/:cartId/clear')
    @UseGuards(JwtAuthGuard)
    async clearCartItems(@Param('cartId') cartId: string) {
        return this.cartItemService.clearCartItems(+cartId);
    }
}
