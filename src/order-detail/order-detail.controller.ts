import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { OrderDetailService } from './order-detail.service';
import { CreateOrderDetailDto, UpdateOrderDetailDto } from './dto/order-detail.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('order-details')
export class OrderDetailController {
    constructor(private readonly orderDetailService: OrderDetailService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body() createOrderDetailDto: CreateOrderDetailDto) {
        return this.orderDetailService.create(createOrderDetailDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.orderDetailService.findAll(page, limit);
    }

    @Get('order/:orderId')
    @UseGuards(JwtAuthGuard)
    async findByOrderId(@Param('orderId') orderId: string) {
        return this.orderDetailService.findByOrderId(+orderId);
    }

    @Get('order/:orderId/total')
    @UseGuards(JwtAuthGuard)
    async getOrderTotal(@Param('orderId') orderId: string) {
        const total = await this.orderDetailService.getOrderTotal(+orderId);
        return { orderId: +orderId, total };
    }

    @Get('product/:productId')
    @UseGuards(JwtAuthGuard)
    async findByProductId(@Param('productId') productId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.orderDetailService.findByProductId(+productId, page, limit);
    }

    @Get('product/:productId/sales')
    @UseGuards(JwtAuthGuard)
    async getProductSales(@Param('productId') productId: string) {
        return this.orderDetailService.getProductSales(+productId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string) {
        return this.orderDetailService.findOne(+id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body() updateOrderDetailDto: UpdateOrderDetailDto) {
        return this.orderDetailService.update(+id, updateOrderDetailDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(@Param('id') id: string) {
        return this.orderDetailService.remove(+id);
    }

    @Delete('order/:orderId')
    @UseGuards(JwtAuthGuard)
    async removeByOrderId(@Param('orderId') orderId: string) {
        return this.orderDetailService.removeByOrderId(+orderId);
    }
}
