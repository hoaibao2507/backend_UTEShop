import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderDto, OrderQueryDto } from './dto/order.dto';
import { OrderStatus } from '../entities/order.entity';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body() createOrderDto: CreateOrderDto) {
        return this.orderService.create(createOrderDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Query() query: OrderQueryDto) {
        return this.orderService.findAll(query);
    }

    @Get('statistics')
    @UseGuards(JwtAuthGuard)
    async getOrderStatistics() {
        return this.orderService.getOrderStatistics();
    }

    @Get('status/:status')
    @UseGuards(JwtAuthGuard)
    async getOrdersByStatus(@Param('status') status: OrderStatus, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.orderService.getOrdersByStatus(status, page, limit);
    }

    @Get('user/:userId')
    @UseGuards(JwtAuthGuard)
    async findByUserId(@Param('userId') userId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.orderService.findByUserId(+userId, page, limit);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string) {
        return this.orderService.findOne(+id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
        return this.orderService.update(+id, updateOrderDto);
    }

    @Put(':id/status')
    @UseGuards(JwtAuthGuard)
    async updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
        return this.orderService.updateStatus(+id, status);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(@Param('id') id: string) {
        return this.orderService.remove(+id);
    }
}
