import { Injectable } from '@nestjs/common';
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

  create(dto: CreateOrderTrackingDto) {
    const tracking = this.trackingRepo.create(dto);
    return this.trackingRepo.save(tracking);
  }

  findAll() {
    return this.trackingRepo.find({ relations: ['order'] });
  }

  findOne(id: number) {
    return this.trackingRepo.findOne({ where: { trackingId: id }, relations: ['order'] });
  }

  update(id: number, dto: UpdateOrderTrackingDto) {
    return this.trackingRepo.update(id, dto);
  }

  remove(id: number) {
    return this.trackingRepo.delete(id);
  }
}
