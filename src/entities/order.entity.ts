import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/users.entity';
import { OrderDetail } from './order-detail.entity';
import { OrderTracking } from './order-tracking.entity';
<<<<<<< HEAD
import { Payment } from './payment.entity';

export enum OrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    SHIPPED = 'shipped',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}
=======
import { OrderStatus } from './order-status.enum';
>>>>>>> origin/main

export enum PaymentMethod {
    COD = 'COD',
    MOMO = 'MOMO',
    ZALOPAY = 'ZALOPAY',
    VNPAY = 'VNPAY'
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  orderId: number;

  @Column()
  userId: number;

  @CreateDateColumn({ type: 'timestamp' })
  orderDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.NEW,
  })
  status: OrderStatus;

<<<<<<< HEAD
    @Column({
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.COD
    })
    paymentMethod: PaymentMethod;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING
    })
    paymentStatus: PaymentStatus;

    @Column({ type: 'text', nullable: true })
    shippingAddress: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    // Relations
    @ManyToOne(() => User, user => user.orders)
    @JoinColumn({ name: 'userId' })
    user: User;
=======
  // Quan hệ với user
  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;
>>>>>>> origin/main

  // Quan hệ với chi tiết đơn hàng
  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order)
  orderDetails: OrderDetail[];

  // Quan hệ với lịch sử tracking
  @OneToMany(() => OrderTracking, (tracking) => tracking.order)
  tracking: OrderTracking[];

<<<<<<< HEAD
    @OneToMany(() => Payment, payment => payment.order)
    payments: Payment[];

    // Virtual properties
    get isCompleted(): boolean {
        return this.status === OrderStatus.COMPLETED;
    }
=======
  // Virtual helpers
  get isDelivered(): boolean {
    return this.status === OrderStatus.DELIVERED;
  }
>>>>>>> origin/main

  get isCanceled(): boolean {
    return this.status === OrderStatus.CANCELED;
  }

  get canBeCanceled(): boolean {
    return (
      this.status === OrderStatus.NEW || this.status === OrderStatus.CONFIRMED
    );
  }
}
