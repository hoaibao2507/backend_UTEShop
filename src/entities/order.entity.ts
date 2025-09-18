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
import { OrderStatus } from './order-status.enum';

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

  // Quan hệ với user
  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Quan hệ với chi tiết đơn hàng
  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order)
  orderDetails: OrderDetail[];

  // Quan hệ với lịch sử tracking
  @OneToMany(() => OrderTracking, (tracking) => tracking.order)
  tracking: OrderTracking[];

  // Virtual helpers
  get isDelivered(): boolean {
    return this.status === OrderStatus.DELIVERED;
  }

  get isCanceled(): boolean {
    return this.status === OrderStatus.CANCELED;
  }

  get canBeCanceled(): boolean {
    return (
      this.status === OrderStatus.NEW || this.status === OrderStatus.CONFIRMED
    );
  }
}
