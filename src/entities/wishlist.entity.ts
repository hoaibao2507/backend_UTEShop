import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Product } from './product.entity';
import { User } from '../users/users.entity';

@Entity('wishlists')
@Unique(['userId', 'productId']) // Mỗi user chỉ có thể thích 1 sản phẩm 1 lần
export class Wishlist {
    @PrimaryGeneratedColumn()
    wishlistId: number;

    @Column()
    userId: number;

    @Column()
    productId: number;

    @CreateDateColumn()
    createdAt: Date;

    // Relations
    @ManyToOne(() => User, user => user.wishlists)
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Product, product => product.wishlists)
    @JoinColumn({ name: 'productId' })
    product: Product;
}
