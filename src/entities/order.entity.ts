import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/users.entity';
import { OrderDetail } from '../entities/order-detail.entity';
import { OrderTracking } from './order-tracking.entity';
import { Payment } from './payment.entity';

export enum OrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    SHIPPED = 'shipped',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

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

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    orderDate: Date;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    totalAmount: number;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING
    })
    status: OrderStatus;

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

    @OneToMany(() => OrderDetail, orderDetail => orderDetail.order)
    orderDetails: OrderDetail[];

    @OneToMany(() => OrderTracking, (tracking) => tracking.order)
    tracking: OrderTracking[];

    @OneToMany(() => Payment, payment => payment.order)
    payments: Payment[];

    // Virtual properties
    get isCompleted(): boolean {
        return this.status === OrderStatus.COMPLETED;
    }

    get isCancelled(): boolean {
        return this.status === OrderStatus.CANCELLED;
    }

    get canBeCancelled(): boolean {
        return this.status === OrderStatus.PENDING || this.status === OrderStatus.PAID;
    }
}
