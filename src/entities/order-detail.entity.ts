import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';

@Entity('order_details')
export class OrderDetail {
    @PrimaryGeneratedColumn()
    orderDetailId: number;

    @Column()
    orderId: number;

    @Column()
    productId: number;

    @Column()
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number;

    // Relations
    @ManyToOne(() => Order, order => order.orderDetails)
    @JoinColumn({ name: 'orderId' })
    order: Order;

    @ManyToOne(() => Product, product => product.orderDetails)
    @JoinColumn({ name: 'productId' })
    product: Product;

    // Virtual properties
    get totalPrice(): number {
        return this.quantity * this.unitPrice;
    }
}
