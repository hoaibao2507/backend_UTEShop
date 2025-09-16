import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { OrderTrackingService } from './order-tracking.service';
import { CreateOrderTrackingDto } from './dto/create-order-tracking.dto';
import { UpdateOrderTrackingDto } from './dto/update-order-tracking.dto';

@Controller('order-tracking')
export class OrderTrackingController {
  constructor(private readonly trackingService: OrderTrackingService) {}

  @Post()
  create(@Body() dto: CreateOrderTrackingDto) {
    return this.trackingService.create(dto);
  }

  @Get()
  findAll() {
    return this.trackingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trackingService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderTrackingDto) {
    return this.trackingService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trackingService.remove(+id);
  }
}
