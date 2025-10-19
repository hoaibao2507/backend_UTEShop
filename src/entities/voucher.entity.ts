import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany, Unique } from 'typeorm';
import { OrderVoucher } from './order-voucher.entity';
import { VoucherUsage } from './voucher-usage.entity';
import { VoucherDiscountType } from './enums/voucher-discount-type.enum';

// enum moved to ./enums/voucher-discount-type.enum

@Entity('vouchers')
@Unique(['code'])
export class Voucher {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 50 })
    code: string; // store uppercase

    @Column({ type: 'varchar', length: 255, nullable: true })
    description?: string;

    @Column({
        type: 'enum',
        enum: VoucherDiscountType,
      })
      discountType: VoucherDiscountType;
    
      

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    discountValue?: number; // null for freeship

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    minOrderValue: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    maxDiscount?: number; // only for percentage

    @Column({ type: 'timestamp' })
    startDate: Date;

    @Column({ type: 'timestamp' })
    endDate: Date;

    @Column({ type: 'int', nullable: true })
    usageLimit?: number; // null = unlimited

    @Column({ type: 'int', default: 0 })
    usedCount: number;

    @Column({ type: 'int', nullable: true })
    perUserLimit?: number; // null = unlimited

    @Column({ type: 'boolean', default: false })
    combinable: boolean;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'boolean', default: false })
    isDeleted: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => OrderVoucher, (orderVoucher: OrderVoucher) => orderVoucher.voucher)
    orderVouchers: OrderVoucher[];

    @OneToMany(() => VoucherUsage, (voucherUsage: VoucherUsage) => voucherUsage.voucher)
    voucherUsages: VoucherUsage[];
}


