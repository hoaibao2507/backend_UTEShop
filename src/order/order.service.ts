import { Injectable, NotFoundException, BadRequestException , ForbiddenException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, PaymentMethod as PaymentMethodEnum, PaymentStatus} from '../entities/order.entity';
import { OrderDetail } from '../entities/order-detail.entity';
import { OrderTracking } from '../entities/order-tracking.entity';
import { OrderStatus } from '../entities/order-status.enum';
import { CreateOrderDto, UpdateOrderDto, OrderQueryDto } from './dto/order.dto';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Product } from '../entities/product.entity';
import { PaymentMethod } from '../entities/payment-method.entity';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(OrderTracking)
        private trackingRepository: Repository<OrderTracking>,
        @InjectRepository(OrderDetail)
        private orderDetailRepository: Repository<OrderDetail>,
        @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,
        @InjectRepository(CartItem)
        private cartItemRepository: Repository<CartItem>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(PaymentMethod)
        private paymentMethodRepository: Repository<PaymentMethod>,
        private webSocketService: WebSocketService,
        private dataSource: DataSource,
    ) {}

    async create(createOrderDto: CreateOrderDto): Promise<Order> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Validate cart exists
            const cart = await this.cartRepository.findOne({
                where: { cartId: createOrderDto.cartId },
                relations: ['user'],
            });

            if (!cart) {
                throw new NotFoundException('Cart not found');
            }

            // 2. Validate payment method
            const paymentMethod = await this.paymentMethodRepository.findOne({
                where: { id: createOrderDto.paymentMethodId },
            });

            if (!paymentMethod) {
                throw new NotFoundException('Payment method not found');
            }

            // 3. Validate selected items and calculate total
            let totalAmount = 0;
            const orderDetailsData: Array<{
                productId: number;
                quantity: number;
                unitPrice: number;
            }> = [];

            for (const item of createOrderDto.selectedItems) {
                // Validate cart item belongs to this cart
                const cartItem = await this.cartItemRepository.findOne({
                    where: { 
                        cartItemId: item.cartItemId,
                        cartId: createOrderDto.cartId 
                    },
                });

                if (!cartItem) {
                    throw new BadRequestException(`Cart item ${item.cartItemId} not found or doesn't belong to this cart`);
                }

                // Validate product exists and has enough stock
                const product = await this.productRepository.findOne({
                    where: { productId: item.productId },
                });

                if (!product) {
                    throw new NotFoundException(`Product ${item.productId} not found`);
                }

                if (product.stockQuantity < item.quantity) {
                    throw new BadRequestException(`Product ${product.productName} doesn't have enough stock`);
                }

                // Calculate item total
                const itemTotal = item.price * item.quantity;
                totalAmount += itemTotal;

                orderDetailsData.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.price,
                });
            }

            // 4. Map payment method name to enum
            let paymentMethodEnum: PaymentMethodEnum;
            switch (paymentMethod.name.toUpperCase()) {
                case 'COD':
                    paymentMethodEnum = PaymentMethodEnum.COD;
                    break;
                case 'MOMO':
                    paymentMethodEnum = PaymentMethodEnum.MOMO;
                    break;
                case 'ZALOPAY':
                    paymentMethodEnum = PaymentMethodEnum.ZALOPAY;
                    break;
                case 'VNPAY':
                    paymentMethodEnum = PaymentMethodEnum.VNPAY;
                    break;
                default:
                    paymentMethodEnum = PaymentMethodEnum.COD;
            }

            // 5. Create order
            const shippingAddress = `${createOrderDto.shippingInfo.shippingAddress}, ${createOrderDto.shippingInfo.ward}, ${createOrderDto.shippingInfo.city}`;
            
            const order = this.orderRepository.create({
                userId: cart.userId,
                totalAmount,
                status: OrderStatus.NEW,
                paymentMethod: paymentMethodEnum,
                paymentStatus: paymentMethodEnum === PaymentMethodEnum.COD ? PaymentStatus.PENDING : PaymentStatus.PENDING,
                shippingAddress,
                notes: createOrderDto.notes || createOrderDto.shippingInfo.notes || '',
            });

            const savedOrder = await queryRunner.manager.save(order);

            // 6. Create order details
            for (const detailData of orderDetailsData) {
                const orderDetail = this.orderDetailRepository.create({
                    orderId: savedOrder.orderId,
                    ...detailData,
                });
                await queryRunner.manager.save(orderDetail);

                // Update product stock
                await queryRunner.manager.decrement(
                    Product,
                    { productId: detailData.productId },
                    'stockQuantity',
                    detailData.quantity
                );
            }

            // 7. Create order tracking
            const tracking = this.trackingRepository.create({
                order: savedOrder,
                status: OrderStatus.NEW,
                note: 'Đơn hàng đã được tạo',
            });
            await queryRunner.manager.save(tracking);

            // 8. Remove selected items from cart
            for (const item of createOrderDto.selectedItems) {
                await queryRunner.manager.delete(CartItem, { cartItemId: item.cartItemId });
            }

            await queryRunner.commitTransaction();

            // Return order with relations
            return await this.findOne(savedOrder.orderId);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            console.error('Error creating order:', error);
            throw new BadRequestException('Failed to create order: ' + error.message);
        } finally {
            await queryRunner.release();
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

    async updateStatus(id: number, status: OrderStatus, updatedBy?: { id: number; username: string }): Promise<Order> {
        const order = await this.findOne(id);
        
        if (!order.canBeCanceled && status === OrderStatus.CANCELED) {
            throw new BadRequestException('Order cannot be cancelled in current status');
        }

        const oldStatus = order.status;
        order.status = status;
        const updatedOrder = await this.orderRepository.save(order);

        // Broadcast WebSocket update to order-specific room
        this.webSocketService.broadcastToRoom(
            `order_${id}`,
            'order_status_update',
            {
                orderId: id,
                oldStatus,
                newStatus: status,
                updatedBy: updatedBy?.id,
                updatedByUsername: updatedBy?.username,
                timestamp: new Date().toISOString(),
            }
        );

        // Determine who updated the order to decide broadcast strategy
        const isStaffUpdate = updatedBy?.id && updatedBy?.username?.includes('staff');
        const isVendorUpdate = updatedBy?.id && updatedBy?.username?.includes('vendor');

        if (isStaffUpdate) {
            // When Staff updates order status
            console.log(`📢 Staff ${updatedBy.username} updated order ${id} status: ${oldStatus} → ${status}`);
            
            // 1. Customer room
            if (order.userId) {
                this.webSocketService.broadcastToRoom(`customer_${order.userId}`, 'order_status_update', {
                    orderId: id,
                    oldStatus,
                    newStatus: status,
                    updatedBy: updatedBy.id,
                    updatedByUsername: updatedBy.username,
                    timestamp: new Date().toISOString(),
                });
            }

            // 2. Vendor room (if order has vendor)
            if (order.vendorId) {
                this.webSocketService.broadcastToRoom(`vendor_${order.vendorId}`, 'order_status_update', {
                    orderId: id,
                    oldStatus,
                    newStatus: status,
                    updatedBy: updatedBy.id,
                    updatedByUsername: updatedBy.username,
                    timestamp: new Date().toISOString(),
                });
            }

            // 3. All staff room
            this.webSocketService.broadcastToRoom('all_staff', 'order_status_update', {
                orderId: id,
                oldStatus,
                newStatus: status,
                updatedBy: updatedBy.id,
                updatedByUsername: updatedBy.username,
                timestamp: new Date().toISOString(),
            });

            // 4. Admin room
            this.webSocketService.broadcastToRoom('all_admin', 'order_status_update', {
                orderId: id,
                oldStatus,
                newStatus: status,
                updatedBy: updatedBy.id,
                updatedByUsername: updatedBy.username,
                timestamp: new Date().toISOString(),
            });

        } else if (isVendorUpdate) {
            // When Vendor updates order status
            console.log(`📢 Vendor ${updatedBy.username} updated order ${id} status: ${oldStatus} → ${status}`);
            
            // 1. Customer room
            if (order.userId) {
                this.webSocketService.broadcastToRoom(`customer_${order.userId}`, 'order_status_update', {
                    orderId: id,
                    oldStatus,
                    newStatus: status,
                    updatedBy: updatedBy.id,
                    updatedByUsername: updatedBy.username,
                    timestamp: new Date().toISOString(),
                });
            }

            // 2. All staff room
            this.webSocketService.broadcastToRoom('all_staff', 'order_status_update', {
                orderId: id,
                oldStatus,
                newStatus: status,
                updatedBy: updatedBy.id,
                updatedByUsername: updatedBy.username,
                timestamp: new Date().toISOString(),
            });

            // 3. Admin room
            this.webSocketService.broadcastToRoom('all_admin', 'order_status_update', {
                orderId: id,
                oldStatus,
                newStatus: status,
                updatedBy: updatedBy.id,
                updatedByUsername: updatedBy.username,
                timestamp: new Date().toISOString(),
            });

        } else {
            // Fallback: Broadcast to all user types (for admin updates or unknown)
            this.webSocketService.broadcastToUserType('staff', 'order_status_update', {
                orderId: id,
                oldStatus,
                newStatus: status,
                updatedBy: updatedBy?.id,
                updatedByUsername: updatedBy?.username,
                timestamp: new Date().toISOString(),
            });

            this.webSocketService.broadcastToUserType('admin', 'order_status_update', {
                orderId: id,
                oldStatus,
                newStatus: status,
                updatedBy: updatedBy?.id,
                updatedByUsername: updatedBy?.username,
                timestamp: new Date().toISOString(),
            });

            this.webSocketService.broadcastToUserType('vendor', 'order_status_update', {
                orderId: id,
                oldStatus,
                newStatus: status,
                updatedBy: updatedBy?.id,
                updatedByUsername: updatedBy?.username,
                timestamp: new Date().toISOString(),
            });

            // Notify the customer who placed the order
            if (order.userId) {
                this.webSocketService.broadcastToRoom(`customer_${order.userId}`, 'order_status_update', {
                    orderId: id,
                    oldStatus,
                    newStatus: status,
                    updatedBy: updatedBy?.id,
                    updatedByUsername: updatedBy?.username,
                    timestamp: new Date().toISOString(),
                });
            }
        }

        return updatedOrder;
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
