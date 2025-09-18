import { Injectable, NotFoundException, BadRequestException , ForbiddenException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order} from '../entities/order.entity';
import { OrderTracking } from '../entities/order-tracking.entity';
import { OrderStatus } from '../entities/order-status.enum';
import { CreateOrderDto, UpdateOrderDto, OrderQueryDto } from './dto/order.dto';

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(OrderTracking)
    private trackingRepository: Repository<OrderTracking>,
    ) {}

    async create(createOrderDto: CreateOrderDto): Promise<Order> {
        try {
            const order = this.orderRepository.create({
                ...createOrderDto,
                status: createOrderDto.status || OrderStatus.NEW,
            });
            return await this.orderRepository.save(order);
        } catch (error) {
            throw new BadRequestException('Failed to create order');
        }
    }

    async findAll(query: OrderQueryDto): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 10, userId, status, sortBy = 'orderDate', sortOrder = 'DESC' } = query;

        const queryBuilder = this.orderRepository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.user', 'user')
            .leftJoinAndSelect('order.orderDetails', 'orderDetails')
            .leftJoinAndSelect('orderDetails.product', 'product');

        // Apply filters
        if (userId) {
            queryBuilder.andWhere('order.userId = :userId', { userId });
        }

        if (status) {
            queryBuilder.andWhere('order.status = :status', { status });
        }

        // Apply sorting
        queryBuilder.orderBy(`order.${sortBy}`, sortOrder);

        // Apply pagination
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [orders, total] = await queryBuilder.getManyAndCount();

        return {
            orders,
            total,
            page,
            limit,
        };
    }

    async findOne(id: number): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { orderId: id },
            relations: ['user', 'orderDetails', 'orderDetails.product', 'orderDetails.product.images'],
        });

        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        return order;
    }

    async findByUserId(userId: number, page: number = 1, limit: number = 10): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
        const [orders, total] = await this.orderRepository.findAndCount({
            where: { userId },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['orderDetails', 'orderDetails.product', 'orderDetails.product.images'],
            order: { orderDate: 'DESC' },
        });

        return {
            orders,
            total,
            page,
            limit,
        };
    }

    async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
        const order = await this.findOne(id);
        
        try {
            Object.assign(order, updateOrderDto);
            return await this.orderRepository.save(order);
        } catch (error) {
            throw new BadRequestException('Failed to update order');
        }
    }

    async remove(id: number): Promise<void> {
        const order = await this.findOne(id);
        
        try {
            await this.orderRepository.remove(order);
        } catch (error) {
            throw new BadRequestException('Failed to delete order');
        }
    }

    async updateStatus(id: number, status: OrderStatus): Promise<Order> {
        const order = await this.findOne(id);
        
        if (!order.canBeCanceled && status === OrderStatus.CANCELED) {
            throw new BadRequestException('Order cannot be cancelled in current status');
        }

        order.status = status;
        return await this.orderRepository.save(order);
    }

    async getOrderStatistics(): Promise<{ totalOrders: number; pendingOrders: number; completedOrders: number; cancelledOrders: number }> {
        const [totalOrders, pendingOrders, completedOrders, cancelledOrders] = await Promise.all([
            this.orderRepository.count(),
            this.orderRepository.count({ where: { status: OrderStatus.NEW } }),
            this.orderRepository.count({ where: { status: OrderStatus.DELIVERED } }),
            this.orderRepository.count({ where: { status: OrderStatus.CANCELED } }),
        ]);

        return {
            totalOrders,
            pendingOrders,
            completedOrders,
            cancelledOrders,
        };
    }

    async getOrdersByStatus(status: OrderStatus, page: number = 1, limit: number = 10): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
        const [orders, total] = await this.orderRepository.findAndCount({
            where: { status },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['user', 'orderDetails', 'orderDetails.product'],
            order: { orderDate: 'DESC' },
        });

        return {
            orders,
            total,
            page,
            limit,
        };
    }

    async cancelOrder(orderId: number) {
    const order = await this.orderRepository.findOneBy({ orderId });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const now = new Date();
    const createdAt = new Date(order.orderDate);
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    let note = '';

    switch (order.status) {
      case OrderStatus.NEW:
      case OrderStatus.CONFIRMED:
        if (diffMinutes <= 30) {
          order.status = OrderStatus.CANCELED;
          note = 'Người dùng hủy đơn trong vòng 30 phút';
        } else {
          throw new ForbiddenException('Không thể hủy sau 30 phút ở trạng thái này');
        }
        break;

      case OrderStatus.PREPARING:
        order.status = OrderStatus.CANCEL_REQUEST;
        note = 'Người dùng gửi yêu cầu hủy đơn';
        break;

      case OrderStatus.SHIPPING:
      case OrderStatus.DELIVERED:
        throw new ForbiddenException('Đơn hàng đang giao hoặc đã giao, không thể hủy');

      case OrderStatus.CANCELED:
        throw new ForbiddenException('Đơn hàng đã bị hủy trước đó');
      case OrderStatus.CANCEL_REQUEST:
        throw new ForbiddenException('Đơn hàng đã có yêu cầu hủy');
    }

    // 1. Cập nhật order
    await this.orderRepository.save(order);

    // 2. Ghi log vào order_tracking
    await this.trackingRepository.save({
      order,
      status: order.status,
      note,
    });

    return order;
  }


}
