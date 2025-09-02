import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { User } from '../users/users.entity';

@Entity('product_reviews')
export class ProductReview {
    @PrimaryGeneratedColumn()
    reviewId: number;

    @Column()
    productId: number;

    @Column()
    userId: number;

    @Column({ type: 'tinyint', unsigned: true })
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment: string;

    @CreateDateColumn()
    createdAt: Date;

    // Relations
    @ManyToOne(() => Product, product => product.reviews)
    @JoinColumn({ name: 'productId' })
    product: Product;

    @ManyToOne(() => User, user => user.reviews)
    @JoinColumn({ name: 'userId' })
    user: User;

    // Virtual properties
    get isValidRating(): boolean {
        return this.rating >= 1 && this.rating <= 5;
    }

    get hasComment(): boolean {
        return !!(this.comment && this.comment.trim().length > 0);
    }
}
