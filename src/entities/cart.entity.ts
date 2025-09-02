import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/users.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart {
    @PrimaryGeneratedColumn()
    cartId: number;

    @Column()
    userId: number;

    // Relations
    @ManyToOne(() => User, user => user.carts)
    @JoinColumn({ name: 'userId' })
    user: User;

    @OneToMany(() => CartItem, cartItem => cartItem.cart)
    cartItems: CartItem[];

    // Virtual properties
    get totalItems(): number {
        return this.cartItems?.reduce((total, item) => total + item.quantity, 0) || 0;
    }

    get totalAmount(): number {
        return this.cartItems?.reduce((total, item) => total + item.totalPrice, 0) || 0;
    }

    get isEmpty(): boolean {
        return this.totalItems === 0;
    }
}
