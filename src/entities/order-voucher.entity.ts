import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { Voucher } from './voucher.entity';
import { VoucherDiscountType } from './enums/voucher-discount-type.enum';

@Entity('order_vouchers')
export class OrderVoucher {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    orderId: number;

    @Column()
    voucherId: number;

    @Column({ type: 'varchar', length: 50 })
    codeSnapshot: string;

    @Column({
        type: 'enum',
        enum: VoucherDiscountType,
      })
      discountTypeSnapshot: VoucherDiscountType;      
      

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    discountValueSnapshot?: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    discountApplied: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Order, order => order.orderDetails, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: Order;

    @ManyToOne(() => Voucher, voucher => voucher.orderVouchers, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'voucherId' })
    voucher: Voucher;
}


