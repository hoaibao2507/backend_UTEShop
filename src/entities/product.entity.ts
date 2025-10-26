import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Category } from './category.entity';
import { ProductImage } from './product-image.entity';
import { ProductView } from './product-view.entity';
import { OrderDetail } from './order-detail.entity';
import { CartItem } from './cart-item.entity';
import { ProductReview } from './product-review.entity';
import { Wishlist } from './wishlist.entity';
import { Vendor } from './vendor.entity';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn()
    productId: number;

    @Column()
    categoryId: number;

    @Column({ nullable: true })
    vendorId?: number;

    @Column({ length: 200 })
    productName: string;

    @Column({ length: 255, unique: true })
    slug: string;

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

    @ManyToOne(() => Vendor, vendor => vendor.products)
    @JoinColumn({ name: 'vendorId' })
    vendor?: Vendor;

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

    @OneToMany(() => Wishlist, wishlist => wishlist.product)
    wishlists: Wishlist[];

    // Virtual properties
    get discountedPrice(): number {
        return this.price * (1 - this.discountPercent / 100);
    }

    get isInStock(): boolean {
        return this.stockQuantity > 0;
    }

    // Thống kê sản phẩm
    get totalViews(): number {
        return this.views?.length || 0;
    }

    get totalReviews(): number {
        return this.reviews?.length || 0;
    }

    get totalPurchases(): number {
        return this.orderDetails?.reduce((total, detail) => total + detail.quantity, 0) || 0;
    }

    get totalWishlists(): number {
        return this.wishlists?.length || 0;
    }

    get averageRating(): number {
        if (!this.reviews || this.reviews.length === 0) return 0;
        const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
        return Math.round((totalRating / this.reviews.length) * 100) / 100;
    }
}
