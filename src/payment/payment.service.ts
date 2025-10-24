import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { PaymentMethod as PaymentMethodEntity } from '../entities/payment-method.entity';
import { Order } from '../entities/order.entity';
import { CreatePaymentDto, UpdatePaymentDto, PaymentStatusUpdateDto } from './dto/payment.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentMethodEntity)
    private paymentMethodRepository: Repository<PaymentMethodEntity>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private notificationService: NotificationService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    // Validate order exists
    const order = await this.orderRepository.findOne({
      where: { orderId: createPaymentDto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${createPaymentDto.orderId} not found`);
    }

    // Validate payment method exists
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: createPaymentDto.paymentMethodId },
    });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${createPaymentDto.paymentMethodId} not found`);
    }

    // Check if payment already exists for this order
    const existingPayment = await this.paymentRepository.findOne({
      where: { orderId: createPaymentDto.orderId },
    });

    if (existingPayment) {
      throw new BadRequestException(`Payment already exists for order ${createPaymentDto.orderId}`);
    }

    // Validate amount matches order total
    if (createPaymentDto.amount !== order.totalAmount) {
      throw new BadRequestException('Payment amount does not match order total amount');
    }

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      status: PaymentStatus.PENDING,
      currency: createPaymentDto.currency || 'VND',
    });

    return this.paymentRepository.save(payment);
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({
      relations: ['order', 'paymentMethod', 'transactions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByOrderId(orderId: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { orderId },
      relations: ['order', 'paymentMethod', 'transactions'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }

    return payment;
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order', 'paymentMethod', 'transactions'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { status },
      relations: ['order', 'paymentMethod'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);

    // If updating status to SUCCESS, set paidAt
    if (updatePaymentDto.status === PaymentStatus.SUCCESS && !payment.paidAt) {
      updatePaymentDto.paidAt = new Date().toISOString();
    }

    Object.assign(payment, updatePaymentDto);
    return this.paymentRepository.save(payment);
  }

  async updateStatus(id: number, statusUpdateDto: PaymentStatusUpdateDto): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order', 'order.user'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    // If updating status to SUCCESS, set paidAt
    if (statusUpdateDto.status === PaymentStatus.SUCCESS && !payment.paidAt) {
      payment.paidAt = new Date();
    }

    payment.status = statusUpdateDto.status;
    
    if (statusUpdateDto.transactionId) {
      payment.transactionId = statusUpdateDto.transactionId;
    }

    if (statusUpdateDto.gatewayData) {
      payment.metadata = { ...payment.metadata, ...statusUpdateDto.gatewayData };
    }

    const updatedPayment = await this.paymentRepository.save(payment);

    // Update order payment status
    await this.updateOrderPaymentStatus(payment.orderId, statusUpdateDto.status);

    // Create notification for payment status update
    try {
      if (statusUpdateDto.status === PaymentStatus.SUCCESS) {
        await this.notificationService.createPaymentSuccessNotification(
          payment.orderId,
          payment.order.userId
        );
      }
    } catch (error) {
      console.error('Failed to create payment notification:', error);
      // Don't throw error to avoid breaking payment update
    }

    return updatedPayment;
  }

  async remove(id: number): Promise<void> {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
  }

  async getPaymentStatistics(): Promise<{
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    totalAmount: number;
  }> {
    const [totalPayments, successfulPayments, failedPayments, pendingPayments] = await Promise.all([
      this.paymentRepository.count(),
      this.paymentRepository.count({ where: { status: PaymentStatus.SUCCESS } }),
      this.paymentRepository.count({ where: { status: PaymentStatus.FAILED } }),
      this.paymentRepository.count({ where: { status: PaymentStatus.PENDING } }),
    ]);

    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'totalAmount')
      .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .getRawOne();

    return {
      totalPayments,
      successfulPayments,
      failedPayments,
      pendingPayments,
      totalAmount: parseFloat(result.totalAmount) || 0,
    };
  }

  private async updateOrderPaymentStatus(orderId: number, paymentStatus: PaymentStatus): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { orderId },
    });

    if (order) {
      // Map payment status to order payment status
      let orderPaymentStatus: string;
      switch (paymentStatus) {
        case PaymentStatus.SUCCESS:
          orderPaymentStatus = 'paid';
          break;
        case PaymentStatus.FAILED:
          orderPaymentStatus = 'failed';
          break;
        case PaymentStatus.CANCELLED:
          orderPaymentStatus = 'cancelled';
          break;
        default:
          orderPaymentStatus = 'pending';
      }

      order.paymentStatus = orderPaymentStatus as any;
      await this.orderRepository.save(order);
    }
  }
}

