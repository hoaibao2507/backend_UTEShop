import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductView } from '../entities/product-view.entity';
import { CreateProductViewDto, ProductViewQueryDto } from './dto/product-view.dto';

@Injectable()
export class ProductViewService {
    constructor(
        @InjectRepository(ProductView)
        private productViewRepository: Repository<ProductView>,
    ) {}

    async create(createProductViewDto: CreateProductViewDto): Promise<ProductView> {
        try {
            const productView = this.productViewRepository.create(createProductViewDto);
            return await this.productViewRepository.save(productView);
        } catch (error) {
            throw new BadRequestException('Failed to create product view');
        }
    }

    async findAll(query: ProductViewQueryDto): Promise<{ views: ProductView[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 10, productId, userId, sortBy = 'viewedAt', sortOrder = 'DESC' } = query;

        const queryBuilder = this.productViewRepository
            .createQueryBuilder('view')
            .leftJoinAndSelect('view.product', 'product')
            .leftJoinAndSelect('view.user', 'user');

        // Apply filters
        if (productId) {
            queryBuilder.andWhere('view.productId = :productId', { productId });
        }

        if (userId) {
            queryBuilder.andWhere('view.userId = :userId', { userId });
        }

        // Apply sorting
        queryBuilder.orderBy(`view.${sortBy}`, sortOrder);

        // Apply pagination
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [views, total] = await queryBuilder.getManyAndCount();

        return {
            views,
            total,
            page,
            limit,
        };
    }

    async findOne(id: number): Promise<ProductView> {
        const view = await this.productViewRepository.findOne({
            where: { viewId: id },
            relations: ['product', 'user'],
        });

        if (!view) {
            throw new NotFoundException(`Product view with ID ${id} not found`);
        }

        return view;
    }

    async findByProductId(productId: number, page: number = 1, limit: number = 10): Promise<{ views: ProductView[]; total: number; page: number; limit: number }> {
        const [views, total] = await this.productViewRepository.findAndCount({
            where: { productId },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['user'],
            order: { viewedAt: 'DESC' },
        });

        return {
            views,
            total,
            page,
            limit,
        };
    }

    async findByUserId(userId: number, page: number = 1, limit: number = 10): Promise<{ views: ProductView[]; total: number; page: number; limit: number }> {
        const [views, total] = await this.productViewRepository.findAndCount({
            where: { userId },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['product'],
            order: { viewedAt: 'DESC' },
        });

        return {
            views,
            total,
            page,
            limit,
        };
    }

    async remove(id: number): Promise<void> {
        const view = await this.findOne(id);
        
        try {
            await this.productViewRepository.remove(view);
        } catch (error) {
            throw new BadRequestException('Failed to delete product view');
        }
    }

    async removeByProductId(productId: number): Promise<void> {
        try {
            await this.productViewRepository.delete({ productId });
        } catch (error) {
            throw new BadRequestException('Failed to delete product views');
        }
    }

    async removeByUserId(userId: number): Promise<void> {
        try {
            await this.productViewRepository.delete({ userId });
        } catch (error) {
            throw new BadRequestException('Failed to delete user views');
        }
    }

    async getProductViewCount(productId: number): Promise<number> {
        return this.productViewRepository.count({
            where: { productId },
        });
    }

    async getMostViewedProducts(limit: number = 10): Promise<{ productId: number; viewCount: number; product: any }[]> {
        const result = await this.productViewRepository
            .createQueryBuilder('view')
            .select('view.productId', 'productId')
            .addSelect('COUNT(*)', 'viewCount')
            .leftJoin('view.product', 'product')
            .addSelect('product.productName', 'productName')
            .addSelect('product.price', 'price')
            .addSelect('product.discountPercent', 'discountPercent')
            .groupBy('view.productId')
            .addGroupBy('product.productName')
            .addGroupBy('product.price')
            .addGroupBy('product.discountPercent')
            .orderBy('viewCount', 'DESC')
            .limit(limit)
            .getRawMany();

        return result.map(item => ({
            productId: parseInt(item.productId),
            viewCount: parseInt(item.viewCount),
            product: {
                productName: item.productName,
                price: parseFloat(item.price),
                discountPercent: parseFloat(item.discountPercent),
            },
        }));
    }

    async getUserViewHistory(userId: number, limit: number = 10): Promise<ProductView[]> {
        return this.productViewRepository.find({
            where: { userId },
            take: limit,
            relations: ['product'],
            order: { viewedAt: 'DESC' },
        });
    }

    async getRecentViews(limit: number = 10): Promise<ProductView[]> {
        return this.productViewRepository.find({
            take: limit,
            relations: ['product', 'user'],
            order: { viewedAt: 'DESC' },
        });
    }
}
