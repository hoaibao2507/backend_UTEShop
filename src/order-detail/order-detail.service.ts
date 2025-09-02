import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderDetail } from '../entities/order-detail.entity';
import { CreateOrderDetailDto, UpdateOrderDetailDto } from './dto/order-detail.dto';

@Injectable()
export class OrderDetailService {
    constructor(
        @InjectRepository(OrderDetail)
        private orderDetailRepository: Repository<OrderDetail>,
    ) {}

    async create(createOrderDetailDto: CreateOrderDetailDto): Promise<OrderDetail> {
        try {
            const orderDetail = this.orderDetailRepository.create(createOrderDetailDto);
            return await this.orderDetailRepository.save(orderDetail);
        } catch (error) {
            throw new BadRequestException('Failed to create order detail');
        }
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ orderDetails: OrderDetail[]; total: number; page: number; limit: number }> {
        const [orderDetails, total] = await this.orderDetailRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            relations: ['order', 'product'],
        });

        return {
            orderDetails,
            total,
            page,
            limit,
        };
    }

    async findOne(id: number): Promise<OrderDetail> {
        const orderDetail = await this.orderDetailRepository.findOne({
            where: { orderDetailId: id },
            relations: ['order', 'product'],
        });

        if (!orderDetail) {
            throw new NotFoundException(`Order detail with ID ${id} not found`);
        }

        return orderDetail;
    }

    async findByOrderId(orderId: number): Promise<OrderDetail[]> {
        return this.orderDetailRepository.find({
            where: { orderId },
            relations: ['product'],
        });
    }

    async findByProductId(productId: number, page: number = 1, limit: number = 10): Promise<{ orderDetails: OrderDetail[]; total: number; page: number; limit: number }> {
        const [orderDetails, total] = await this.orderDetailRepository.findAndCount({
            where: { productId },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['order', 'product'],
        });

        return {
            orderDetails,
            total,
            page,
            limit,
        };
    }

    async update(id: number, updateOrderDetailDto: UpdateOrderDetailDto): Promise<OrderDetail> {
        const orderDetail = await this.findOne(id);
        
        try {
            Object.assign(orderDetail, updateOrderDetailDto);
            return await this.orderDetailRepository.save(orderDetail);
        } catch (error) {
            throw new BadRequestException('Failed to update order detail');
        }
    }

    async remove(id: number): Promise<void> {
        const orderDetail = await this.findOne(id);
        
        try {
            await this.orderDetailRepository.remove(orderDetail);
        } catch (error) {
            throw new BadRequestException('Failed to delete order detail');
        }
    }

    async removeByOrderId(orderId: number): Promise<void> {
        try {
            await this.orderDetailRepository.delete({ orderId });
        } catch (error) {
            throw new BadRequestException('Failed to delete order details');
        }
    }

    async getOrderTotal(orderId: number): Promise<number> {
        const orderDetails = await this.findByOrderId(orderId);
        return orderDetails.reduce((total, detail) => total + detail.totalPrice, 0);
    }

    async getProductSales(productId: number): Promise<{ totalQuantity: number; totalRevenue: number }> {
        const orderDetails = await this.orderDetailRepository.find({
            where: { productId },
            relations: ['order'],
        });

        const totalQuantity = orderDetails.reduce((sum, detail) => sum + detail.quantity, 0);
        const totalRevenue = orderDetails.reduce((sum, detail) => sum + detail.totalPrice, 0);

        return {
            totalQuantity,
            totalRevenue,
        };
    }
}
