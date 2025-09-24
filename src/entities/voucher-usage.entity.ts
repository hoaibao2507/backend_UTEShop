import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { Voucher } from './voucher.entity';
import { User } from '../users/users.entity';

@Entity('voucher_usages')
@Unique(['voucherId', 'userId'])
export class VoucherUsage {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column()
    voucherId: number;

    @Index()
    @Column()
    userId: number;

    @Column({ type: 'int', default: 0 })
    timesUsed: number;

    @ManyToOne(() => Voucher, voucher => voucher.voucherUsages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'voucherId' })
    voucher: Voucher;

    @ManyToOne(() => User, user => user.orders, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}


