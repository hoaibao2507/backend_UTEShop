import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from '../entities/cart-item.entity';
import { CreateCartItemDto, UpdateCartItemDto } from './dto/cart-item.dto';

@Injectable()
export class CartItemService {
    constructor(
        @InjectRepository(CartItem)
        private cartItemRepository: Repository<CartItem>,
    ) {}

    async create(createCartItemDto: CreateCartItemDto): Promise<CartItem> {
        try {
            // Check if item already exists in cart
            const existingItem = await this.cartItemRepository.findOne({
                where: {
                    cartId: createCartItemDto.cartId,
                    productId: createCartItemDto.productId,
                },
                relations: ['product'],
            });

            if (existingItem) {
                // Update quantity if item already exists
                existingItem.quantity += createCartItemDto.quantity;
                return await this.cartItemRepository.save(existingItem);
            }

            const cartItem = this.cartItemRepository.create(createCartItemDto);
            return await this.cartItemRepository.save(cartItem);
        } catch (error) {
            throw new BadRequestException('Failed to create cart item');
        }
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ cartItems: CartItem[]; total: number; page: number; limit: number }> {
        const [cartItems, total] = await this.cartItemRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            relations: ['cart', 'product'],
        });

        return {
            cartItems,
            total,
            page,
            limit,
        };
    }

    async findOne(id: number): Promise<CartItem> {
        const cartItem = await this.cartItemRepository.findOne({
            where: { cartItemId: id },
            relations: ['cart', 'product'],
        });

        if (!cartItem) {
            throw new NotFoundException(`Cart item with ID ${id} not found`);
        }

        return cartItem;
    }

    async findByCartId(cartId: number): Promise<CartItem[]> {
        return this.cartItemRepository.find({
            where: { cartId },
            relations: ['product'],
        });
    }

    async update(id: number, updateCartItemDto: UpdateCartItemDto): Promise<CartItem> {
        const cartItem = await this.findOne(id);
        
        try {
            Object.assign(cartItem, updateCartItemDto);
            return await this.cartItemRepository.save(cartItem);
        } catch (error) {
            throw new BadRequestException('Failed to update cart item');
        }
    }

    async remove(id: number): Promise<void> {
        const cartItem = await this.findOne(id);
        
        try {
            await this.cartItemRepository.remove(cartItem);
        } catch (error) {
            throw new BadRequestException('Failed to delete cart item');
        }
    }

    async removeByCartAndProduct(cartId: number, productId: number): Promise<void> {
        const cartItem = await this.cartItemRepository.findOne({
            where: { cartId, productId },
        });

        if (!cartItem) {
            throw new NotFoundException('Cart item not found');
        }

        try {
            await this.cartItemRepository.remove(cartItem);
        } catch (error) {
            throw new BadRequestException('Failed to delete cart item');
        }
    }

    async clearCartItems(cartId: number): Promise<void> {
        try {
            await this.cartItemRepository.delete({ cartId });
        } catch (error) {
            throw new BadRequestException('Failed to clear cart items');
        }
    }

    async updateQuantity(id: number, quantity: number): Promise<CartItem | void> {
        if (quantity <= 0) {
            await this.remove(id);
            return;
        }

        const cartItem = await this.findOne(id);
        cartItem.quantity = quantity;
        return await this.cartItemRepository.save(cartItem);
    }
}
