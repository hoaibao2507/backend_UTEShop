import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { OrderTrackingService } from './order-tracking.service';
import { CreateOrderTrackingDto } from './dto/create-order-tracking.dto';
import { UpdateOrderTrackingDto } from './dto/update-order-tracking.dto';

@ApiTags('order-tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('order-tracking')
export class OrderTrackingController {
  constructor(private readonly trackingService: OrderTrackingService) {}

  @Post()
  @ApiOperation({ summary: 'Thêm trạng thái tracking mới (Admin/Shop)' })
  async create(@Body() dto: CreateOrderTrackingDto) {
    return this.trackingService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả tracking (Admin)' })
  async findAll() {
    return this.trackingService.findAll();
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Lấy lịch sử trạng thái của 1 đơn hàng (User)' })
  async findByOrder(@Param('orderId') orderId: string, @Request() req) {
    return this.trackingService.findByOrder(+orderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 tracking theo trackingId (Admin)' })
  async findOne(@Param('id') id: string) {
    return this.trackingService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật trạng thái tracking (Admin/Shop)' })
  async update(@Param('id') id: string, @Body() dto: UpdateOrderTrackingDto) {
    return this.trackingService.update(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa trạng thái tracking (Admin/Shop)' })
  async remove(@Param('id') id: string) {
    return this.trackingService.remove(+id);
  }
}
