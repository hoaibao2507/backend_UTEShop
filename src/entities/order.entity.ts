import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/users.entity';
import { OrderDetail } from './order-detail.entity';

export enum OrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    SHIPPED = 'shipped',
    COMPLETED = 'completed',
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

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalAmount: number;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING
    })
    status: OrderStatus;

    // Relations
    @ManyToOne(() => User, user => user.orders)
    @JoinColumn({ name: 'userId' })
    user: User;

    @OneToMany(() => OrderDetail, orderDetail => orderDetail.order)
    orderDetails: OrderDetail[];

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
