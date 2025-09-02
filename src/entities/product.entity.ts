import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Category } from './category.entity';
import { ProductImage } from './product-image.entity';
import { ProductView } from './product-view.entity';
import { OrderDetail } from './order-detail.entity';
import { CartItem } from './cart-item.entity';
import { ProductReview } from './product-review.entity';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn()
    productId: number;

    @Column()
    categoryId: number;

    @Column({ length: 200 })
    productName: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    discountPercent: number;

    @Column({ default: 0 })
    stockQuantity: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Category, category => category.products)
    @JoinColumn({ name: 'categoryId' })
    category: Category;

    @OneToMany(() => ProductImage, productImage => productImage.product)
    images: ProductImage[];

    @OneToMany(() => ProductView, productView => productView.product)
    views: ProductView[];

    @OneToMany(() => OrderDetail, orderDetail => orderDetail.product)
    orderDetails: OrderDetail[];

    @OneToMany(() => CartItem, cartItem => cartItem.product)
    cartItems: CartItem[];

    @OneToMany(() => ProductReview, productReview => productReview.product)
    reviews: ProductReview[];

    // Virtual properties
    get discountedPrice(): number {
        return this.price * (1 - this.discountPercent / 100);
    }

    get isInStock(): boolean {
        return this.stockQuantity > 0;
    }
}
