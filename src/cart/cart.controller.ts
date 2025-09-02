import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto, UpdateCartDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('carts')
export class CartController {
    constructor(private readonly cartService: CartService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body() createCartDto: CreateCartDto) {
        return this.cartService.create(createCartDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.cartService.findAll(page, limit);
    }

    @Get('user/:userId')
    @UseGuards(JwtAuthGuard)
    async findByUserId(@Param('userId') userId: string) {
        return this.cartService.findByUserId(+userId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string) {
        return this.cartService.findOne(+id);
    }

    @Get(':id/summary')
    @UseGuards(JwtAuthGuard)
    async getCartSummary(@Param('id') id: string) {
        return this.cartService.getCartSummary(+id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
        return this.cartService.update(+id, updateCartDto);
    }

    @Put(':id/clear')
    @UseGuards(JwtAuthGuard)
    async clearCart(@Param('id') id: string) {
        return this.cartService.clearCart(+id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(@Param('id') id: string) {
        return this.cartService.remove(+id);
    }
}
