import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderTracking } from '../entities/order-tracking.entity';
import { CreateOrderTrackingDto } from './dto/create-order-tracking.dto';
import { UpdateOrderTrackingDto } from './dto/update-order-tracking.dto';

@Injectable()
export class OrderTrackingService {
  constructor(
    @InjectRepository(OrderTracking)
    private readonly trackingRepo: Repository<OrderTracking>,
  ) {}

  // Tạo tracking mới (Admin/Shop thêm khi đơn chuyển trạng thái)
  async create(dto: CreateOrderTrackingDto): Promise<OrderTracking> {
    try {
      const tracking = this.trackingRepo.create(dto);
      return await this.trackingRepo.save(tracking);
    } catch (error) {
      throw new BadRequestException('Failed to create order tracking: ' + error.message);
    }
  }

  // Lấy toàn bộ tracking (Admin)
  async findAll(): Promise<OrderTracking[]> {
    return this.trackingRepo.find({
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }

  // Lấy tracking theo id
  async findOne(id: number): Promise<OrderTracking> {
    const tracking = await this.trackingRepo.findOne({
      where: { trackingId: id },
      relations: ['order'],
    });
    if (!tracking) {
      throw new NotFoundException(`Tracking with ID ${id} not found`);
    }
    return tracking;
  }

  // 🔹 Lấy lịch sử trạng thái theo đơn hàng
  async findByOrder(orderId: number): Promise<OrderTracking[]> {
    const trackings = await this.trackingRepo.find({
      where: { orderId },
      order: { createdAt: 'ASC' }, // timeline theo thời gian
    });

    if (!trackings || trackings.length === 0) {
      throw new NotFoundException(
        `Không tìm thấy lịch sử trạng thái cho orderId=${orderId}`,
      );
    }

    return trackings;
  }

  // Cập nhật tracking
  async update(
    id: number,
    dto: UpdateOrderTrackingDto,
  ): Promise<OrderTracking> {
    const tracking = await this.findOne(id);
    Object.assign(tracking, dto);
    return this.trackingRepo.save(tracking);
  }

  // Xóa tracking
  async remove(id: number): Promise<void> {
    const tracking = await this.findOne(id);
    await this.trackingRepo.remove(tracking);
  }
}
