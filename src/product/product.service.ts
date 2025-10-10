import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { CategoryService } from '../category/category.service';

@Injectable()
export class ProductService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @Inject(forwardRef(() => CategoryService))
        private categoryService: CategoryService,
    ) {}

    async create(createProductDto: CreateProductDto): Promise<Product> {
        try {
            const product = this.productRepository.create({
                ...createProductDto,
                discountPercent: createProductDto.discountPercent || 0,
                stockQuantity: createProductDto.stockQuantity || 0,
            });
            const savedProduct = await this.productRepository.save(product);
            
            // Cập nhật productCount cho category
            await this.categoryService.updateProductCount(savedProduct.categoryId);
            
            return savedProduct;
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
        const oldCategoryId = product.categoryId;
        
        try {
            Object.assign(product, updateProductDto);
            const updatedProduct = await this.productRepository.save(product);
            
            // Cập nhật productCount cho category cũ và mới (nếu có thay đổi)
            await this.categoryService.updateProductCount(oldCategoryId);
            if (updateProductDto.categoryId && updateProductDto.categoryId !== oldCategoryId) {
                await this.categoryService.updateProductCount(updateProductDto.categoryId);
            }
            
            return updatedProduct;
        } catch (error) {
            throw new BadRequestException('Failed to update product');
        }
    }

    async remove(id: number): Promise<void> {
        const product = await this.findOne(id);
        const categoryId = product.categoryId;
        
        try {
            await this.productRepository.remove(product);
            
            // Cập nhật productCount cho category sau khi xóa
            await this.categoryService.updateProductCount(categoryId);
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

    // API cho trang chủ - sản phẩm mới nhất
    async getLatestProducts(limit: number = 10): Promise<Product[]> {
        // Query đơn giản trước để lấy danh sách sản phẩm
        const simpleResult = await this.productRepository
            .createQueryBuilder('product')
            .where('product.stockQuantity > 0')
            .orderBy('product.createdAt', 'DESC')
            .limit(limit)
            .getMany();
        
        // Nếu có kết quả, load relations
        if (simpleResult.length > 0) {
            return await this.productRepository
                .createQueryBuilder('product')
                .leftJoinAndSelect('product.category', 'category')
                .leftJoinAndSelect('product.images', 'images')
                .where('product.productId IN (:...ids)', { ids: simpleResult.map(p => p.productId) })
                .orderBy('product.createdAt', 'DESC')
                .getMany();
        }
        
        return simpleResult;
    }



    // API cho trang chủ - sản phẩm bán chạy nhất
    async getBestSellingProducts(limit: number = 10): Promise<Product[]> {
        // Query để lấy danh sách sản phẩm bán chạy nhất với số lượng đã bán
        const bestSellingQuery = this.productRepository
            .createQueryBuilder('product')
            .leftJoin('product.orderDetails', 'orderDetail')
            .leftJoin('orderDetail.order', 'order')
            .where('product.stockQuantity > 0')
            .andWhere('order.status = :status', { status: 'completed' })
            .select([
                'product.productId as productId',
                'COUNT(orderDetail.orderDetailId) as totalSold'
            ])
            .groupBy('product.productId')
            .orderBy('totalSold', 'DESC')
            .limit(limit);

        const bestSellingResults = await bestSellingQuery.getRawMany();
        
        // Nếu có ít hơn limit sản phẩm có đơn hàng, bổ sung bằng sản phẩm mới nhất
        if (bestSellingResults.length < limit) {
            const existingProductIds = bestSellingResults.map(result => result.productId);
            const remainingLimit = limit - bestSellingResults.length;
            
            // Lấy thêm sản phẩm mới nhất không có trong danh sách bán chạy
            const additionalProducts = await this.productRepository
                .createQueryBuilder('product')
                .leftJoinAndSelect('product.category', 'category')
                .leftJoinAndSelect('product.images', 'images')
                .where('product.stockQuantity > 0')
                .andWhere('product.productId NOT IN (:...ids)', { ids: existingProductIds.length > 0 ? existingProductIds : [0] })
                .orderBy('product.createdAt', 'DESC')
                .limit(remainingLimit)
                .getMany();
            
            // Load đầy đủ thông tin cho sản phẩm bán chạy
            const bestSellingProducts = existingProductIds.length > 0 ? await this.productRepository
                .createQueryBuilder('product')
                .leftJoinAndSelect('product.category', 'category')
                .leftJoinAndSelect('product.images', 'images')
                .where('product.productId IN (:...ids)', { ids: existingProductIds })
                .getMany() : [];
            
            // Sắp xếp lại theo thứ tự bán chạy
            const sortedBestSelling = existingProductIds.map(id => 
                bestSellingProducts.find(product => product.productId === id)
            ).filter((product): product is Product => product !== undefined);
            
            return [...sortedBestSelling, ...additionalProducts];
        }
        
        if (bestSellingResults.length === 0) {
            // Nếu không có sản phẩm nào có đơn hàng, trả về sản phẩm mới nhất
            return this.getLatestProducts(limit);
        }

        // Lấy danh sách productId từ kết quả
        const productIds = bestSellingResults.map(result => result.productId);
        
        // Load đầy đủ thông tin sản phẩm với relations
        const products = await this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.images', 'images')
            .where('product.productId IN (:...ids)', { ids: productIds })
            .getMany();

        // Sắp xếp lại theo thứ tự bán chạy
        const sortedProducts = productIds.map(id => 
            products.find(product => product.productId === id)
        ).filter((product): product is Product => product !== undefined);

        return sortedProducts;
    }

    // API cho trang chủ - sản phẩm được xem nhiều nhất
    async getMostViewedProducts(limit: number = 10): Promise<any[]> {
        // Get products with view counts, ordered by most viewed
        const productsWithViews = await this.productRepository
            .createQueryBuilder('product')
            .leftJoin('product.views', 'productView')
            .leftJoin('product.category', 'category')
            .where('product.stockQuantity > 0')
            .select([
                'product.productId',
                'product.categoryId', 
                'product.productName',
                'product.description',
                'product.price',
                'product.discountPercent',
                'product.stockQuantity',
                'product.createdAt',
                'product.updatedAt',
                'category.categoryId',
                'category.categoryName',
                'category.description',
                'category.createdAt',
                'COUNT(productView.viewId) as totalViews'
            ])
            .groupBy('product.productId')
            .addGroupBy('product.categoryId')
            .addGroupBy('product.productName')
            .addGroupBy('product.description')
            .addGroupBy('product.price')
            .addGroupBy('product.discountPercent')
            .addGroupBy('product.stockQuantity')
            .addGroupBy('product.createdAt')
            .addGroupBy('product.updatedAt')
            .addGroupBy('category.categoryId')
            .addGroupBy('category.categoryName')
            .addGroupBy('category.description')
            .addGroupBy('category.createdAt')
            .orderBy('totalViews', 'DESC')
            .limit(limit)
            .getRawMany();

        if (productsWithViews.length === 0) {
            return [];
        }

        // Get product IDs for fetching images
        const productIds = productsWithViews.map(p => p.product_productId);

        // Get images for these products
        const images = await this.productRepository
            .createQueryBuilder('product')
            .leftJoin('product.images', 'images')
            .where('product.productId IN (:...productIds)', { productIds })
            .select([
                'images.imageId',
                'images.productId',
                'images.imageUrl',
                'images.isPrimary'
            ])
            .getRawMany();

        // Transform results
        const result = productsWithViews.map(row => {
            const productId = row.product_productId;
            const productImages = images
                .filter(img => img.images_productId === productId)
                .map(img => ({
                    imageId: img.images_imageId,
                    productId: img.images_productId,
                    imageUrl: img.images_imageUrl,
                    isPrimary: img.images_isPrimary
                }));

            return {
                productId: row.product_productId,
                categoryId: row.product_categoryId,
                productName: row.product_productName,
                description: row.product_description,
                price: row.product_price,
                discountPercent: row.product_discountPercent,
                stockQuantity: row.product_stockQuantity,
                createdAt: row.product_createdAt,
                updatedAt: row.product_updatedAt,
                totalViews: parseInt(row.totalViews),
                category: {
                    categoryId: row.category_categoryId,
                    categoryName: row.category_categoryName,
                    description: row.category_description,
                    createdAt: row.category_createdAt
                },
                images: productImages
            };
        });

        return result;
    }

    // API cho trang chủ - sản phẩm khuyến mãi cao nhất
    async getTopDiscountProducts(limit: number = 10): Promise<Product[]> {
        try {
            // Simple approach: get products without relations first, then add relations
            const productIds = await this.productRepository
                .createQueryBuilder('product')
                .select('product.productId')
                .where('product.discountPercent > 0')
                .andWhere('product.stockQuantity > 0')
                .orderBy('product.discountPercent', 'DESC')
                .addOrderBy('product.productId', 'ASC')
                .limit(limit)
                .getRawMany();

            console.log(`Found ${productIds.length} product IDs with discount > 0`);

            if (productIds.length === 0) {
                return [];
            }

            // Now get full product data with relations
            const products = await this.productRepository
                .createQueryBuilder('product')
                .leftJoinAndSelect('product.category', 'category')
                .leftJoinAndSelect('product.images', 'images')
                .where('product.productId IN (:...productIds)', { 
                    productIds: productIds.map(p => p.product_productId) 
                })
                .orderBy('product.discountPercent', 'DESC')
                .addOrderBy('product.productId', 'ASC')
                .getMany();

            console.log(`Returning ${products.length} products with relations`);
            return products;
        } catch (error) {
            console.error('Error in getTopDiscountProducts:', error);
            throw error;
        }
    }

    // API tổng hợp cho trang chủ
    async getHomepageProducts(limits?: {
        latestLimit?: number;
        bestSellingLimit?: number;
        mostViewedLimit?: number;
        topDiscountLimit?: number;
    }): Promise<{
        latestProducts: Product[];
        bestSellingProducts: Product[];
        mostViewedProducts: Product[];
        topDiscountProducts: Product[];
    }> {
        const {
            latestLimit = 8,
            bestSellingLimit = 6,
            mostViewedLimit = 8,
            topDiscountLimit = 4
        } = limits || {};

        const [latestProducts, bestSellingProducts, mostViewedProducts, topDiscountProducts] = await Promise.all([
            this.getLatestProducts(latestLimit),
            this.getBestSellingProducts(bestSellingLimit),
            this.getMostViewedProducts(mostViewedLimit),
            this.getTopDiscountProducts(topDiscountLimit)
        ]);

        return {
            latestProducts,
            bestSellingProducts,
            mostViewedProducts,
            topDiscountProducts
        };
    }

    // API cho sản phẩm tương tự
    async getSimilarProducts(productId: number, limit: number = 6): Promise<Product[]> {
        // Lấy thông tin sản phẩm hiện tại
        const currentProduct = await this.findOne(productId);
        
        if (!currentProduct) {
            return [];
        }

        // Tìm sản phẩm tương tự dựa trên:
        // 1. Cùng category
        // 2. Cùng khoảng giá (±30%)
        // 3. Loại trừ sản phẩm hiện tại
        const minPrice = currentProduct.price * 0.7;
        const maxPrice = currentProduct.price * 1.3;

        const similarProducts = await this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.images', 'images')
            .where('product.productId != :productId', { productId })
            .andWhere('product.categoryId = :categoryId', { categoryId: currentProduct.categoryId })
            .andWhere('product.stockQuantity > 0')
            .andWhere('product.price BETWEEN :minPrice AND :maxPrice', { minPrice, maxPrice })
            .orderBy('product.createdAt', 'DESC')
            .limit(limit)
            .getMany();

        // Nếu không đủ sản phẩm cùng category và giá, bổ sung bằng sản phẩm cùng category
        if (similarProducts.length < limit) {
            const existingIds = similarProducts.map(p => p.productId);
            const remainingLimit = limit - similarProducts.length;

            const additionalProducts = await this.productRepository
                .createQueryBuilder('product')
                .leftJoinAndSelect('product.category', 'category')
                .leftJoinAndSelect('product.images', 'images')
                .where('product.productId != :productId', { productId })
                .andWhere('product.categoryId = :categoryId', { categoryId: currentProduct.categoryId })
                .andWhere('product.stockQuantity > 0')
                .andWhere('product.productId NOT IN (:...existingIds)', { existingIds: existingIds.length > 0 ? existingIds : [0] })
                .orderBy('product.createdAt', 'DESC')
                .limit(remainingLimit)
                .getMany();

            similarProducts.push(...additionalProducts);
        }

        // Nếu vẫn không đủ, bổ sung bằng sản phẩm bán chạy
        if (similarProducts.length < limit) {
            const existingIds = similarProducts.map(p => p.productId);
            const remainingLimit = limit - similarProducts.length;

            const bestSellingProducts = await this.getBestSellingProducts(remainingLimit);
            const filteredBestSelling = bestSellingProducts.filter(p => 
                !existingIds.includes(p.productId) && p.productId !== productId
            );

            similarProducts.push(...filteredBestSelling.slice(0, remainingLimit));
        }

        return similarProducts.slice(0, limit);
    }

    // API thống kê tổng quan sản phẩm
    async getProductStats(productId: number): Promise<{
        productId: number;
        totalViews: number;
        totalReviews: number;
        totalPurchases: number;
        totalWishlists: number;
        averageRating: number;
        ratingDistribution: { [key: number]: number };
    }> {
        const product = await this.findOne(productId);
        
        if (!product) {
            throw new NotFoundException(`Product with ID ${productId} not found`);
        }

        // Lấy thống kê từ các bảng liên quan
        const [viewCount, reviewCount, purchaseCount, wishlistCount] = await Promise.all([
            this.productRepository
                .createQueryBuilder('product')
                .leftJoin('product.views', 'views')
                .where('product.productId = :productId', { productId })
                .select('COUNT(views.viewId)', 'count')
                .getRawOne(),
            
            this.productRepository
                .createQueryBuilder('product')
                .leftJoin('product.reviews', 'reviews')
                .where('product.productId = :productId', { productId })
                .select('COUNT(reviews.reviewId)', 'count')
                .getRawOne(),
            
            this.productRepository
                .createQueryBuilder('product')
                .leftJoin('product.orderDetails', 'orderDetails')
                .leftJoin('orderDetails.order', 'order')
                .where('product.productId = :productId', { productId })
                .andWhere('order.status = :status', { status: 'DELIVERED' })
                .select('SUM(orderDetails.quantity)', 'count')
                .getRawOne(),
            
            this.productRepository
                .createQueryBuilder('product')
                .leftJoin('product.wishlists', 'wishlists')
                .where('product.productId = :productId', { productId })
                .select('COUNT(wishlists.wishlistId)', 'count')
                .getRawOne()
        ]);

        // Lấy phân phối rating
        const ratingStats = await this.productRepository
            .createQueryBuilder('product')
            .leftJoin('product.reviews', 'reviews')
            .where('product.productId = :productId', { productId })
            .select('reviews.rating', 'rating')
            .addSelect('COUNT(reviews.reviewId)', 'count')
            .groupBy('reviews.rating')
            .getRawMany();

        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRating = 0;
        let totalReviews = 0;

        ratingStats.forEach(stat => {
            const rating = parseInt(stat.rating);
            const count = parseInt(stat.count);
            ratingDistribution[rating] = count;
            totalRating += rating * count;
            totalReviews += count;
        });

        const averageRating = totalReviews > 0 ? Math.round((totalRating / totalReviews) * 100) / 100 : 0;

        return {
            productId,
            totalViews: parseInt(viewCount.count) || 0,
            totalReviews: parseInt(reviewCount.count) || 0,
            totalPurchases: parseInt(purchaseCount.count) || 0,
            totalWishlists: parseInt(wishlistCount.count) || 0,
            averageRating,
            ratingDistribution
        };
    }
}
