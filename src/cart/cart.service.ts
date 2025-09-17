import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CreateCartDto, UpdateCartDto } from './dto/cart.dto';

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,
    ) {}

    async create(createCartDto: CreateCartDto): Promise<Cart> {
        try {
            // Check if user already has a cart
            const existingCart = await this.cartRepository.findOne({
                where: { userId: createCartDto.userId },
            });

            if (existingCart) {
                return existingCart;
            }

            const cart = this.cartRepository.create(createCartDto);
            return await this.cartRepository.save(cart);
        } catch (error) {
            throw new BadRequestException('Failed to create cart');
        }
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ carts: Cart[]; total: number; page: number; limit: number }> {
        const [carts, total] = await this.cartRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            relations: ['user', 'cartItems', 'cartItems.product'],
        });

        return {
            carts,
            total,
            page,
            limit,
        };
    }

    async findOne(id: number): Promise<Cart> {
        const cart = await this.cartRepository.findOne({
            where: { cartId: id },
            relations: ['user', 'cartItems', 'cartItems.product'],
        });

        if (!cart) {
            throw new NotFoundException(`Cart with ID ${id} not found`);
        }

        return cart;
    }

    async findByUserId(userId: number): Promise<Cart> {
        let cart = await this.cartRepository.findOne({
            where: { userId },
            relations: ['user', 'cartItems', 'cartItems.product'],
        });

        // Nếu user chưa có giỏ hàng, tạo mới
        if (!cart) {
            cart = await this.create({ userId });
        }

        return cart;
    }

    async update(id: number, updateCartDto: UpdateCartDto): Promise<Cart> {
        const cart = await this.findOne(id);
        
        try {
            Object.assign(cart, updateCartDto);
            return await this.cartRepository.save(cart);
        } catch (error) {
            throw new BadRequestException('Failed to update cart');
        }
    }

    async remove(id: number): Promise<void> {
        const cart = await this.findOne(id);
        
        try {
            await this.cartRepository.remove(cart);
        } catch (error) {
            throw new BadRequestException('Failed to delete cart');
        }
    }

    async clearCart(id: number): Promise<Cart> {
        const cart = await this.findOne(id);
        
        // Remove all cart items
        cart.cartItems = [];
        return await this.cartRepository.save(cart);
    }

    async getCartSummary(id: number): Promise<{ totalItems: number; totalAmount: number; isEmpty: boolean }> {
        const cart = await this.findOne(id);
        
        return {
            totalItems: cart.totalItems,
            totalAmount: cart.totalAmount,
            isEmpty: cart.isEmpty,
        };
    }
}
