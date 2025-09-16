import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { OrderStatus } from './order.entity';

@Entity('order_tracking')
export class OrderTracking {
  @PrimaryGeneratedColumn()
  trackingId: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
  })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Order, (order) => order.tracking, { onDelete: 'CASCADE' })
  order: Order;
}
