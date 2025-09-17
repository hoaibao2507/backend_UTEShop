import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../entities/order.entity';
import { Payment } from '../entities/payment.entity';
import { PaymentMethod as PaymentMethodEntity } from '../entities/payment-method.entity';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Product } from '../entities/product.entity';
import { CreateOrderDto } from './dto/order.dto';
import { PaymentService } from '../payment/payment.service';

export interface CreateOrderWithPaymentDto extends CreateOrderDto {
  cartId: number;
  paymentMethodId: number;
}

export interface OrderSummary {
  order: Order;
  payment: Payment;
  totalItems: number;
  totalAmount: number;
}

@Injectable()
export class OrderPaymentService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(PaymentMethodEntity)
    private paymentMethodRepository: Repository<PaymentMethodEntity>,
    private paymentService: PaymentService,
  ) {}

  async createOrderWithPayment(createOrderDto: CreateOrderWithPaymentDto): Promise<OrderSummary> {
    // 1. Validate cart exists and has items
    const cart = await this.cartRepository.findOne({
      where: { cartId: createOrderDto.cartId },
      relations: ['cartItems', 'cartItems.product'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${createOrderDto.cartId} not found`);
    }

    if (!cart.cartItems || cart.cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 2. Validate payment method
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: createOrderDto.paymentMethodId },
    });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${createOrderDto.paymentMethodId} not found`);
    }

    if (!paymentMethod.isActive) {
      throw new BadRequestException('Payment method is not active');
    }

    // 3. Calculate total amount and validate inventory
    let totalAmount = 0;
    const orderDetails: Array<{
      productId: number;
      quantity: number;
      price: number;
      total: number;
    }> = [];

    for (const cartItem of cart.cartItems) {
      const product = await this.productRepository.findOne({
        where: { productId: cartItem.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${cartItem.productId} not found`);
      }

      if (product.stockQuantity < cartItem.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.productName}. Available: ${product.stockQuantity}, Requested: ${cartItem.quantity}`);
      }

      const itemTotal = product.price * cartItem.quantity;
      totalAmount += itemTotal;

      orderDetails.push({
        productId: product.productId,
        quantity: cartItem.quantity,
        price: product.price,
        total: itemTotal,
      });
    }

    // 4. Validate total amount matches
    if (Math.abs(totalAmount - createOrderDto.totalAmount) > 0.01) {
      throw new BadRequestException(`Total amount mismatch. Calculated: ${totalAmount}, Provided: ${createOrderDto.totalAmount}`);
    }

    // 5. Create order
    const order = this.orderRepository.create({
      userId: createOrderDto.userId,
      totalAmount,
      status: OrderStatus.PENDING,
      paymentMethod: paymentMethod.name as PaymentMethod,
      paymentStatus: PaymentStatus.PENDING,
      shippingAddress: createOrderDto.shippingAddress,
      notes: createOrderDto.notes,
    });

    const savedOrder = await this.orderRepository.save(order);

    // 6. Create order details
    for (const detail of orderDetails) {
      await this.orderRepository.query(`
        INSERT INTO order_details (orderId, productId, quantity, price, total)
        VALUES (?, ?, ?, ?, ?)
      `, [savedOrder.orderId, detail.productId, detail.quantity, detail.price, detail.total]);
    }

    // 7. Update inventory
    for (const cartItem of cart.cartItems) {
      await this.productRepository.query(`
        UPDATE products 
        SET stockQuantity = stockQuantity - ? 
        WHERE productId = ?
      `, [cartItem.quantity, cartItem.productId]);
    }

    // 8. Create payment
    const payment = await this.paymentService.create({
      orderId: savedOrder.orderId,
      paymentMethodId: createOrderDto.paymentMethodId,
      amount: totalAmount,
      currency: 'VND',
      description: `Payment for order #${savedOrder.orderId}`,
    });

    // 9. Clear cart
    await this.cartItemRepository.delete({ cartId: createOrderDto.cartId });

    return {
      order: savedOrder,
      payment,
      totalItems: cart.cartItems.length,
      totalAmount,
    };
  }

  async processCODPayment(orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.paymentMethod !== PaymentMethod.COD) {
      throw new BadRequestException('Order is not using COD payment method');
    }

    // For COD, payment is considered successful when order is delivered
    // This would typically be called when delivery is confirmed
    order.paymentStatus = PaymentStatus.PAID;
    order.status = OrderStatus.COMPLETED;

    return this.orderRepository.save(order);
  }

  async cancelOrder(orderId: number, reason?: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed order');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    // Cancel order
    order.status = OrderStatus.CANCELLED;
    order.paymentStatus = PaymentStatus.CANCELLED;

    // Restore inventory
    const orderDetails = await this.orderRepository.query(`
      SELECT productId, quantity FROM order_details WHERE orderId = ?
    `, [orderId]);

    for (const detail of orderDetails) {
      await this.productRepository.query(`
        UPDATE products 
        SET stockQuantity = stockQuantity + ? 
        WHERE productId = ?
      `, [detail.quantity, detail.productId]);
    }

    // Cancel payment if exists
    try {
      const payment = await this.paymentService.findByOrderId(orderId);
      await this.paymentService.updateStatus(payment.id, {
        status: PaymentStatus.CANCELLED as any,
        gatewayData: { reason: reason || 'Order cancelled' },
      });
    } catch (error) {
      // Payment might not exist yet
    }

    return this.orderRepository.save(order);
  }

  async getOrderWithPayment(orderId: number): Promise<{
    order: Order;
    payment?: Payment;
    orderDetails: any[];
  }> {
    const order = await this.orderRepository.findOne({
      where: { orderId },
      relations: ['user', 'payments'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    let payment: Payment | undefined;
    try {
      payment = await this.paymentService.findByOrderId(orderId);
    } catch (error) {
      // Payment might not exist
    }

    const orderDetails = await this.orderRepository.query(`
      SELECT 
        od.*,
        p.name as productName,
        p.image as productImage
      FROM order_details od
      LEFT JOIN products p ON od.productId = p.id
      WHERE od.orderId = ?
    `, [orderId]);

    return {
      order,
      payment,
      orderDetails,
    };
  }
}
