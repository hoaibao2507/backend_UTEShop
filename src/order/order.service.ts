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
import { Voucher } from '../entities/voucher.entity';
import { VoucherUsage } from '../entities/voucher-usage.entity';
import { OrderVoucher } from '../entities/order-voucher.entity';
import { WebSocketService } from '../websocket/websocket.service';
import { VoucherService } from '../voucher/voucher.service';
import { NotificationService } from '../notification/notification.service';

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
        private voucherService: VoucherService,
        private notificationService: NotificationService,
        private dataSource: DataSource,
    ) {}

    async create(createOrderDto: CreateOrderDto): Promise<Order> {
        
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction('READ COMMITTED');
        
        // Set lock wait timeout to 10 seconds
        await queryRunner.query('SET innodb_lock_wait_timeout = 10');

        try {
            // Determine if this is cart-based or direct order creation
            const isCartBased = createOrderDto.cartId && createOrderDto.selectedItems && createOrderDto.selectedItems.length > 0;
            const isDirectOrder = createOrderDto.orderDetails && createOrderDto.orderDetails.length > 0;

            if (!isCartBased && !isDirectOrder) {
                throw new BadRequestException('Either selectedItems (cart-based) or orderDetails (direct) must be provided');
            }

            let cart: any = null;
            let paymentMethodEnum: PaymentMethodEnum;
            let shippingAddress: string;

            // 1. Validate cart if cart-based order
            if (isCartBased) {
                cart = await this.cartRepository.findOne({
                    where: { cartId: createOrderDto.cartId! },
                    relations: ['user'],
                });

                if (!cart) {
                    throw new NotFoundException('Cart not found');
                }
            }

            // 2. Validate and map payment method
            if (createOrderDto.paymentMethodId) {
                // Old format: using paymentMethodId
                const paymentMethod = await this.paymentMethodRepository.findOne({
                    where: { id: createOrderDto.paymentMethodId },
                });

                if (!paymentMethod) {
                    throw new NotFoundException('Payment method not found');
                }

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
            } else if (createOrderDto.paymentMethod) {
                // New format: using paymentMethod string
                switch (createOrderDto.paymentMethod.toUpperCase()) {
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
            } else {
                throw new BadRequestException('Payment method is required');
            }

            // 3. Prepare shipping address
            if (createOrderDto.shippingAddress) {
                // New format: direct shipping address
                shippingAddress = createOrderDto.shippingAddress;
            } else if (createOrderDto.shippingInfo) {
                // Old format: shippingInfo object
                shippingAddress = `${createOrderDto.shippingInfo.shippingAddress}, ${createOrderDto.shippingInfo.ward}, ${createOrderDto.shippingInfo.city}`;
            } else {
                throw new BadRequestException('Shipping address is required');
            }

            // 4. Validate items and calculate subtotal (products only, no shipping)
            let subtotal = 0;
            const orderDetailsData: Array<{
                productId: number;
                quantity: number;
                unitPrice: number;
            }> = [];

            if (isCartBased) {
                // Cart-based order: validate cart items
                for (const item of createOrderDto.selectedItems!) {
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
                    const unitPrice = Number(item.price);
                    const itemTotal = unitPrice * item.quantity;
                    subtotal += itemTotal;

                    orderDetailsData.push({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: unitPrice,
                    });
                }
            } else {
                // Direct order: validate orderDetails
                for (const detail of createOrderDto.orderDetails!) {
                    // Validate product exists and has enough stock
                    const product = await this.productRepository.findOne({
                        where: { productId: detail.productId },
                    });

                    if (!product) {
                        throw new NotFoundException(`Product ${detail.productId} not found`);
                    }

                    if (product.stockQuantity < detail.quantity) {
                        throw new BadRequestException(`Product ${product.productName} doesn't have enough stock`);
                    }

                    // Calculate item total
                    const unitPrice = Number(detail.unitPrice);
                    const itemTotal = unitPrice * detail.quantity;
                    subtotal += itemTotal;

                    orderDetailsData.push({
                        productId: detail.productId,
                        quantity: detail.quantity,
                        unitPrice: unitPrice,
                    });
                }
            }

            // 5. Get shipping fee from request or default to 0
            const shippingFee = Number(createOrderDto.shippingFee) || 0;

            // 6. Handle voucher if provided (apply to subtotal only, not shipping)
            let voucherDiscount = 0;
            let voucherId: number | null = null;

            // Handle voucher by ID (new format)
            if (createOrderDto.voucherId) {
                try {
                    // Fetch voucher by ID
                    const voucher = await queryRunner.manager.findOne(Voucher, {
                        where: { id: createOrderDto.voucherId }
                    });

                    if (!voucher) {
                        throw new NotFoundException('Voucher not found');
                    }

                    // Validate voucher for user (apply to subtotal only)
                    const voucherValidation = await this.voucherService.validateVoucherForUser(
                        voucher.code,
                        createOrderDto.userId,
                        subtotal
                    );

                    if (!voucherValidation.valid) {
                        throw new BadRequestException(`Voucher validation failed: ${voucherValidation.message}`);
                    }

                    voucherDiscount = voucherValidation.discount;
                    voucherId = createOrderDto.voucherId;

                } catch (error) {
                    console.error('Voucher validation error:', error);
                    throw new BadRequestException(`Voucher validation failed: ${error.message}`);
                }
            } 
            // Handle voucher by code (old format)
            else if (createOrderDto.voucherCode) {
                try {
                    const voucherValidation = await this.voucherService.validateVoucherForUser(
                        createOrderDto.voucherCode,
                        createOrderDto.userId,
                        subtotal
                    );

                    if (!voucherValidation.valid) {
                        throw new BadRequestException(`Voucher validation failed: ${voucherValidation.message}`);
                    }

                    voucherDiscount = voucherValidation.discount;
                    voucherId = voucherValidation.voucher?.id || null;
                } catch (error) {
                    console.error('Voucher validation error:', error);
                    throw new BadRequestException(`Voucher validation failed: ${error.message}`);
                }
            }

            // 7. Calculate final amount: subtotal + shippingFee - voucherDiscount
            const finalAmount = Math.max(0, subtotal + shippingFee - voucherDiscount);

            // Validate with frontend's totalAmount if provided
            const frontendTotalAmount = createOrderDto.totalAmount ? Number(createOrderDto.totalAmount) : null;
            if (frontendTotalAmount && Math.abs(frontendTotalAmount - finalAmount) > 1) {
                console.warn(`Amount mismatch - Frontend: ${frontendTotalAmount}, Backend: ${finalAmount}`);
                // Log warning but don't throw error to avoid blocking orders
            }

            // 8. Create order
            const order = this.orderRepository.create({
                userId: isCartBased ? cart.userId : createOrderDto.userId,
                totalAmount: finalAmount, // Final amount = subtotal + shipping - discount
                status: OrderStatus.NEW,
                paymentMethod: paymentMethodEnum,
                paymentStatus: paymentMethodEnum === PaymentMethodEnum.COD ? PaymentStatus.PENDING : PaymentStatus.PENDING,
                shippingAddress,
                notes: createOrderDto.notes || (createOrderDto.shippingInfo?.notes) || '',
            });

            const savedOrder = await queryRunner.manager.save(order);

            // 9. Create order details
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

            // 10. Create order tracking
            const tracking = this.trackingRepository.create({
                order: savedOrder,
                status: OrderStatus.NEW,
                note: 'Đơn hàng đã được tạo',
            });
            await queryRunner.manager.save(tracking);

            // 11. Record voucher usage if voucher was applied (within same transaction)
            if (voucherId && voucherDiscount > 0) {
                // Update voucher used count
                await queryRunner.manager.increment(Voucher, { id: voucherId }, 'usedCount', 1);

                // Update or create voucher usage record
                const existingUsage = await queryRunner.manager.findOne(VoucherUsage, {
                    where: { voucherId, userId: createOrderDto.userId }
                });

                if (existingUsage) {
                    existingUsage.timesUsed += 1;
                    await queryRunner.manager.save(VoucherUsage, existingUsage);
                } else {
                    const newUsage = queryRunner.manager.create(VoucherUsage, {
                        voucherId,
                        userId: createOrderDto.userId,
                        timesUsed: 1
                    });
                    await queryRunner.manager.save(VoucherUsage, newUsage);
                }

                // Create order voucher record
                const voucher = await queryRunner.manager.findOne(Voucher, { where: { id: voucherId } });
                if (voucher) {
                    const orderVoucher = queryRunner.manager.create(OrderVoucher, {
                        orderId: savedOrder.orderId,
                        voucherId,
                        codeSnapshot: voucher.code,
                        discountTypeSnapshot: voucher.discountType,
                        discountValueSnapshot: voucher.discountValue,
                        discountApplied: voucherDiscount
                    });
                    await queryRunner.manager.save(OrderVoucher, orderVoucher);
                }
            }

            // 12. Remove selected items from cart (only for cart-based orders)
            if (isCartBased) {
                for (const item of createOrderDto.selectedItems!) {
                    await queryRunner.manager.delete(CartItem, { cartItemId: item.cartItemId });
                }
            }

            await queryRunner.commitTransaction();

            // Create initial notification for order creation
            try {
                await this.notificationService.createOrderStatusNotification(
                    savedOrder.orderId,
                    'Đơn hàng mới',
                    savedOrder.userId
                );
            } catch (error) {
                console.error('Failed to create order notification:', error);
                // Don't throw error to avoid breaking order creation
            }

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

        // Create notification for order status update
        try {
            await this.notificationService.createOrderStatusNotification(
                id,
                status,
                order.userId
            );
        } catch (error) {
            console.error('Failed to create order status notification:', error);
            // Don't throw error to avoid breaking order update
        }

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

    // 3. Create notification for order cancellation
    try {
      await this.notificationService.createOrderStatusNotification(
        orderId,
        order.status,
        order.userId
      );
    } catch (error) {
      console.error('Failed to create order cancellation notification:', error);
      // Don't throw error to avoid breaking order cancellation
    }

    return order;
  }


}
