import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { User } from '../users/users.entity';

@Entity('product_views')
export class ProductView {
    @PrimaryGeneratedColumn()
    viewId: number;

    @Column()
    productId: number;

    @Column({ nullable: true })
    userId: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    viewedAt: Date;

    // Relations
    @ManyToOne(() => Product, product => product.views)
    @JoinColumn({ name: 'productId' })
    product: Product;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;
}
