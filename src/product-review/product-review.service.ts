import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductReview } from '../entities/product-review.entity';
import { CreateProductReviewDto, UpdateProductReviewDto, ProductReviewQueryDto } from './dto/product-review.dto';

@Injectable()
export class ProductReviewService {
    constructor(
        @InjectRepository(ProductReview)
        private productReviewRepository: Repository<ProductReview>,
    ) {}

    async create(createProductReviewDto: CreateProductReviewDto): Promise<ProductReview> {
        try {
            // Check if user already reviewed this product
            const existingReview = await this.productReviewRepository.findOne({
                where: {
                    productId: createProductReviewDto.productId,
                    userId: createProductReviewDto.userId,
                },
            });

            if (existingReview) {
                throw new BadRequestException('User has already reviewed this product');
            }

            const productReview = this.productReviewRepository.create(createProductReviewDto);
            return await this.productReviewRepository.save(productReview);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to create product review');
        }
    }

    async findAll(query: ProductReviewQueryDto): Promise<{ reviews: ProductReview[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 10, productId, userId, rating, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

        const queryBuilder = this.productReviewRepository
            .createQueryBuilder('review')
            .leftJoinAndSelect('review.product', 'product')
            .leftJoinAndSelect('review.user', 'user');

        // Apply filters
        if (productId) {
            queryBuilder.andWhere('review.productId = :productId', { productId });
        }

        if (userId) {
            queryBuilder.andWhere('review.userId = :userId', { userId });
        }

        if (rating) {
            queryBuilder.andWhere('review.rating = :rating', { rating });
        }

        // Apply sorting
        queryBuilder.orderBy(`review.${sortBy}`, sortOrder);

        // Apply pagination
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [reviews, total] = await queryBuilder.getManyAndCount();

        return {
            reviews,
            total,
            page,
            limit,
        };
    }

    async findOne(id: number): Promise<ProductReview> {
        const review = await this.productReviewRepository.findOne({
            where: { reviewId: id },
            relations: ['product', 'user'],
        });

        if (!review) {
            throw new NotFoundException(`Product review with ID ${id} not found`);
        }

        return review;
    }

    async findByProductId(productId: number, page: number = 1, limit: number = 10): Promise<{ reviews: ProductReview[]; total: number; page: number; limit: number }> {
        const [reviews, total] = await this.productReviewRepository.findAndCount({
            where: { productId },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });

        return {
            reviews,
            total,
            page,
            limit,
        };
    }

    async findByUserId(userId: number, page: number = 1, limit: number = 10): Promise<{ reviews: ProductReview[]; total: number; page: number; limit: number }> {
        const [reviews, total] = await this.productReviewRepository.findAndCount({
            where: { userId },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['product'],
            order: { createdAt: 'DESC' },
        });

        return {
            reviews,
            total,
            page,
            limit,
        };
    }

    async update(id: number, updateProductReviewDto: UpdateProductReviewDto): Promise<ProductReview> {
        const review = await this.findOne(id);
        
        try {
            Object.assign(review, updateProductReviewDto);
            return await this.productReviewRepository.save(review);
        } catch (error) {
            throw new BadRequestException('Failed to update product review');
        }
    }

    async remove(id: number): Promise<void> {
        const review = await this.findOne(id);
        
        try {
            await this.productReviewRepository.remove(review);
        } catch (error) {
            throw new BadRequestException('Failed to delete product review');
        }
    }

    async getProductRatingStats(productId: number): Promise<{ averageRating: number; totalReviews: number; ratingDistribution: { [key: number]: number } }> {
        const reviews = await this.productReviewRepository.find({
            where: { productId },
        });

        if (reviews.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            };
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        const ratingDistribution = reviews.reduce((dist, review) => {
            dist[review.rating] = (dist[review.rating] || 0) + 1;
            return dist;
        }, {} as { [key: number]: number });

        // Fill missing ratings with 0
        for (let i = 1; i <= 5; i++) {
            if (!ratingDistribution[i]) {
                ratingDistribution[i] = 0;
            }
        }

        return {
            averageRating: Math.round(averageRating * 100) / 100,
            totalReviews: reviews.length,
            ratingDistribution,
        };
    }

    async getUserReviewForProduct(userId: number, productId: number): Promise<ProductReview | null> {
        return this.productReviewRepository.findOne({
            where: { userId, productId },
            relations: ['product'],
        });
    }
}
