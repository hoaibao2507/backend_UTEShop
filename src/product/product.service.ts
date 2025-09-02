import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';

@Injectable()
export class ProductService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
    ) {}

    async create(createProductDto: CreateProductDto): Promise<Product> {
        try {
            const product = this.productRepository.create({
                ...createProductDto,
                discountPercent: createProductDto.discountPercent || 0,
                stockQuantity: createProductDto.stockQuantity || 0,
            });
            return await this.productRepository.save(product);
        } catch (error) {
            throw new BadRequestException('Failed to create product');
        }
    }

    async findAll(query: ProductQueryDto): Promise<{ products: Product[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 10, categoryId, search, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

        const queryBuilder = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.images', 'images')
            .leftJoinAndSelect('product.reviews', 'reviews');

        // Apply filters
        if (categoryId) {
            queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
        }

        if (search) {
            queryBuilder.andWhere('(product.productName LIKE :search OR product.description LIKE :search)', {
                search: `%${search}%`,
            });
        }

        if (minPrice !== undefined) {
            queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
        }

        if (maxPrice !== undefined) {
            queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
        }

        // Apply sorting
        queryBuilder.orderBy(`product.${sortBy}`, sortOrder);

        // Apply pagination
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [products, total] = await queryBuilder.getManyAndCount();

        return {
            products,
            total,
            page,
            limit,
        };
    }

    async findOne(id: number): Promise<Product> {
        const product = await this.productRepository.findOne({
            where: { productId: id },
            relations: ['category', 'images', 'reviews', 'reviews.user'],
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return product;
    }

    async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
        const product = await this.findOne(id);
        
        try {
            Object.assign(product, updateProductDto);
            return await this.productRepository.save(product);
        } catch (error) {
            throw new BadRequestException('Failed to update product');
        }
    }

    async remove(id: number): Promise<void> {
        const product = await this.findOne(id);
        
        try {
            await this.productRepository.remove(product);
        } catch (error) {
            throw new BadRequestException('Cannot delete product with existing orders or cart items');
        }
    }

    async updateStock(id: number, quantity: number): Promise<Product> {
        const product = await this.findOne(id);
        
        if (product.stockQuantity + quantity < 0) {
            throw new BadRequestException('Insufficient stock');
        }

        product.stockQuantity += quantity;
        return await this.productRepository.save(product);
    }

    async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
        return this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.images', 'images')
            .where('product.discountPercent > 0')
            .orderBy('product.discountPercent', 'DESC')
            .limit(limit)
            .getMany();
    }

    async getProductsByCategory(categoryId: number, limit: number = 10): Promise<Product[]> {
        return this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.images', 'images')
            .where('product.categoryId = :categoryId', { categoryId })
            .orderBy('product.createdAt', 'DESC')
            .limit(limit)
            .getMany();
    }
}
