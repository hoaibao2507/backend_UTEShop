import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from './product.entity';

@Entity('cart_items')
export class CartItem {
    @PrimaryGeneratedColumn()
    cartItemId: number;

    @Column()
    cartId: number;

    @Column()
    productId: number;

    @Column()
    quantity: number;

    // Relations
    @ManyToOne(() => Cart, cart => cart.cartItems)
    @JoinColumn({ name: 'cartId' })
    cart: Cart;

    @ManyToOne(() => Product, product => product.cartItems)
    @JoinColumn({ name: 'productId' })
    product: Product;

    // Virtual properties
    get totalPrice(): number {
        return this.quantity * (this.product?.discountedPrice || 0);
    }

    get isAvailable(): boolean {
        return this.product?.isInStock && this.quantity <= (this.product?.stockQuantity || 0);
    }
}
