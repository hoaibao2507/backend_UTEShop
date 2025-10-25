import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductImage } from '../entities/product-image.entity';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, CreateProductWithImagesDto, UpdateProductWithImagesDto } from './dto/product.dto';
import { CategoryService } from '../category/category.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SharedElasticsearchService, IElasticsearchResponse } from '../shared/services/elasticsearch.service';
import { ProductIndexDocument } from '../shared/interfaces/elasticsearch.interface';

@Injectable()
export class ProductService implements OnModuleInit {
    private readonly logger = new Logger(ProductService.name);
    private readonly indexName = 'products';

    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(ProductImage)
        private productImageRepository: Repository<ProductImage>,
        @Inject(forwardRef(() => CategoryService))
        private categoryService: CategoryService,
        private cloudinaryService: CloudinaryService,
        private sharedElasticsearchService: SharedElasticsearchService,
    ) {
        this.initializeSearchIndex();
    }

    async onModuleInit() {
        // Elasticsearch connection is handled by SharedElasticsearchService
        this.logger.log('ProductService initialized');
    }

    private async initializeSearchIndex() {
        try {
            await this.initializeElasticsearchIndex();
            console.log('Elasticsearch index initialized');
        } catch (error) {
            console.error('Failed to initialize Elasticsearch index:', error);
        }
    }

    // ==================== ELASTICSEARCH METHODS ====================

    /**
     * Initialize Elasticsearch index with mappings and settings
     */
    async initializeElasticsearchIndex(): Promise<IElasticsearchResponse> {
        const mappings = {
            properties: {
                id: { type: 'integer' },
                name: {
                    type: 'text',
                    analyzer: 'vi_analyzer',
                    fields: {
                        keyword: { type: 'keyword' }
                    }
                },
                description: {
                    type: 'text',
                    analyzer: 'vi_analyzer'
                },
                price: { type: 'float' },
                categoryId: { type: 'integer' },
                vendorId: { type: 'integer' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' }
            }
        };

        const settings = {
            analysis: {
                analyzer: {
                    vi_analyzer: {
                        type: 'custom',
                        tokenizer: 'standard',
                        filter: ['lowercase', 'asciifolding', 'vi_stop']
                    }
                },
                filter: {
                    vi_stop: {
                        type: 'stop',
                        stopwords: ['và', 'của', 'với', 'cho', 'từ', 'trong', 'để', 'là', 'có', 'được', 'này', 'đó', 'một', 'các', 'những', 'sản', 'phẩm', 'sản phẩm']
                    }
                }
            }
        };

        return this.sharedElasticsearchService.createIndex(this.indexName, mappings, settings);
    }

    /**
     * Index a product document in Elasticsearch
     */
    async indexProductInElasticsearch(product: ProductIndexDocument): Promise<IElasticsearchResponse> {
        return this.sharedElasticsearchService.indexDocument(this.indexName, product.id.toString(), product);
    }

    /**
     * Search products in Elasticsearch
     */
    async searchInElasticsearch<T = any>(
        searchBody: Record<string, any>,
    ): Promise<IElasticsearchResponse<Array<{ _id: string; _source: T }>>> {
        return this.sharedElasticsearchService.search<T>(this.indexName, searchBody);
    }

    /**
     * Update a product document in Elasticsearch
     */
    async updateProductInElasticsearch<T = any>(
        id: string,
        document: Partial<T>,
    ): Promise<IElasticsearchResponse> {
        return this.sharedElasticsearchService.updateDocument(this.indexName, id, document);
    }

    /**
     * Delete a product document from Elasticsearch
     */
    async deleteProductFromElasticsearch(id: string): Promise<IElasticsearchResponse> {
        return this.sharedElasticsearchService.deleteDocument(this.indexName, id);
    }

    async createWithImages(
        createProductWithImagesDto: CreateProductWithImagesDto,
        images: Express.Multer.File[]
    ): Promise<Product> {
        try {
            // Validation
            if (!images || images.length === 0) {
                throw new BadRequestException('Vui lòng thêm ít nhất một ảnh sản phẩm');
            }

            if (images.length > 10) {
                throw new BadRequestException('Chỉ được tải tối đa 10 ảnh');
            }

            const primaryImageIndex = createProductWithImagesDto.primaryImageIndex || 0;
            if (primaryImageIndex < 0 || primaryImageIndex >= images.length) {
                throw new BadRequestException('Ảnh chính không hợp lệ');
            }

            // Validate image types and sizes
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            const maxSize = 5 * 1024 * 1024; // 5MB

            for (const image of images) {
                if (!allowedTypes.includes(image.mimetype)) {
                    throw new BadRequestException(`Định dạng ảnh không được hỗ trợ: ${image.mimetype}`);
                }
                if (image.size > maxSize) {
                    throw new BadRequestException(`Kích thước ảnh quá lớn: ${image.originalname}`);
                }
            }

            // Create product first
            const product = this.productRepository.create({
                categoryId: createProductWithImagesDto.categoryId,
                productName: createProductWithImagesDto.productName,
                description: createProductWithImagesDto.description,
                price: createProductWithImagesDto.price,
                discountPercent: createProductWithImagesDto.discountPercent || 0,
                stockQuantity: createProductWithImagesDto.stockQuantity || 0,
            });

            const savedProduct = await this.productRepository.save(product);

            // Upload images to Cloudinary
            const uploadedImages: ProductImage[] = [];
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const isPrimary = i === primaryImageIndex;

                try {
                    const imageUrl = await this.cloudinaryService.uploadImage(image, 'products');
                    const publicId = this.cloudinaryService.extractPublicId(imageUrl);

                    const productImage = this.productImageRepository.create({
                        productId: savedProduct.productId,
                        imageUrl: imageUrl,
                        publicId: publicId,
                        isPrimary: isPrimary,
                        sortOrder: i,
                    });

                    const savedImage = await this.productImageRepository.save(productImage);
                    uploadedImages.push(savedImage);
                } catch (error) {
                    // If upload fails, clean up already uploaded images
                    for (const uploadedImage of uploadedImages) {
                        try {
                            await this.cloudinaryService.deleteImage(uploadedImage.publicId);
                        } catch (deleteError) {
                            console.error('Failed to delete image:', deleteError);
                        }
                    }
                    throw new BadRequestException(`Lỗi upload ảnh: ${image.originalname}`);
                }
            }

            // Update productCount for category
            await this.categoryService.updateProductCount(savedProduct.categoryId);

            // Return product with images
            const productWithImages = await this.productRepository.findOne({
                where: { productId: savedProduct.productId },
                relations: ['images', 'category'],
            });

            if (!productWithImages) {
                throw new NotFoundException('Product not found after creation');
            }

            return productWithImages;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to create product with images');
        }
    }

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

    async updateWithImages(
        id: number,
        updateProductWithImagesDto: UpdateProductWithImagesDto,
        images: Express.Multer.File[]
    ): Promise<Product> {
        try {
            const product = await this.findOne(id);
            const oldCategoryId = product.categoryId;

            // Parse FormData fields
            const hasNewImages = updateProductWithImagesDto.hasNewImages === 'true';
            const existingImageIds = updateProductWithImagesDto.existingImageIds
                ? updateProductWithImagesDto.existingImageIds.split(',').map(Number).filter(id => !isNaN(id))
                : [];
            const remainingImageIds = updateProductWithImagesDto.remainingImageIds
                ? updateProductWithImagesDto.remainingImageIds.split(',').map(Number).filter(id => !isNaN(id))
                : [];
            const keepExistingImages = updateProductWithImagesDto.keepExistingImages === 'true';

            // Find images to delete
            const imagesToDelete = existingImageIds.filter(id => !remainingImageIds.includes(id));

            // Validation for new images
            if (hasNewImages && images && images.length > 0) {
                if (images.length > 10) {
                    throw new BadRequestException('Chỉ được tải tối đa 10 ảnh');
                }

                const primaryImageIndex = updateProductWithImagesDto.primaryImageIndex || 0;
                if (primaryImageIndex < 0 || primaryImageIndex >= images.length) {
                    throw new BadRequestException('Ảnh chính không hợp lệ');
                }

                // Validate image types and sizes
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                const maxSize = 5 * 1024 * 1024; // 5MB

                for (const image of images) {
                    if (!allowedTypes.includes(image.mimetype)) {
                        throw new BadRequestException(`Định dạng ảnh không được hỗ trợ: ${image.mimetype}`);
                    }
                    if (image.size > maxSize) {
                        throw new BadRequestException(`Kích thước ảnh quá lớn: ${image.originalname}`);
                    }
                }
            }

            // Update product basic info
            Object.assign(product, {
                categoryId: updateProductWithImagesDto.categoryId || product.categoryId,
                productName: updateProductWithImagesDto.productName || product.productName,
                description: updateProductWithImagesDto.description || product.description,
                price: updateProductWithImagesDto.price || product.price,
                discountPercent: updateProductWithImagesDto.discountPercent !== undefined ? updateProductWithImagesDto.discountPercent : product.discountPercent,
                stockQuantity: updateProductWithImagesDto.stockQuantity !== undefined ? updateProductWithImagesDto.stockQuantity : product.stockQuantity,
            });

            const updatedProduct = await this.productRepository.save(product);

            // Delete images that are no longer needed
            if (imagesToDelete.length > 0) {
                for (const imageId of imagesToDelete) {
                    try {
                        const imageToDelete = await this.productImageRepository.findOne({
                            where: { imageId: imageId, productId: id }
                        });

                        if (imageToDelete) {
                            // Delete from Cloudinary
                            await this.cloudinaryService.deleteImage(imageToDelete.publicId);

                            // Delete from database
                            await this.productImageRepository.delete({ imageId: imageId });
                        }
                    } catch (error) {
                        console.error(`Failed to delete image ${imageId}:`, error);
                    }
                }
            }

            // Handle new images if provided
            if (hasNewImages && images && images.length > 0) {
                if (!keepExistingImages) {
                    // Delete all existing images
                    const existingImages = await this.productImageRepository.find({
                        where: { productId: id }
                    });

                    for (const existingImage of existingImages) {
                        try {
                            await this.cloudinaryService.deleteImage(existingImage.publicId);
                        } catch (error) {
                            console.error('Failed to delete existing image:', error);
                        }
                    }

                    await this.productImageRepository.delete({ productId: id });
                }

                // Upload new images
                const uploadedImages: ProductImage[] = [];
                const primaryImageIndex = updateProductWithImagesDto.primaryImageIndex || 0;

                for (let i = 0; i < images.length; i++) {
                    const image = images[i];
                    const isPrimary = i === primaryImageIndex;

                    try {
                        const imageUrl = await this.cloudinaryService.uploadImage(image, 'products');
                        const publicId = this.cloudinaryService.extractPublicId(imageUrl);

                        const productImage = this.productImageRepository.create({
                            productId: updatedProduct.productId,
                            imageUrl: imageUrl,
                            publicId: publicId,
                            isPrimary: isPrimary,
                            sortOrder: keepExistingImages ? (await this.productImageRepository.count({ where: { productId: id } })) + i : i,
                        });

                        const savedImage = await this.productImageRepository.save(productImage);
                        uploadedImages.push(savedImage);
                    } catch (error) {
                        // If upload fails, clean up already uploaded images
                        for (const uploadedImage of uploadedImages) {
                            try {
                                await this.cloudinaryService.deleteImage(uploadedImage.publicId);
                            } catch (deleteError) {
                                console.error('Failed to delete image:', deleteError);
                            }
                        }
                        throw new BadRequestException(`Lỗi upload ảnh: ${image.originalname}`);
                    }
                }
            }

            // Update primary image if specified
            if (updateProductWithImagesDto.primaryImageIndex !== undefined) {
                const primaryImageIndex = updateProductWithImagesDto.primaryImageIndex;

                // Reset all images to non-primary
                await this.productImageRepository.update(
                    { productId: id },
                    { isPrimary: false }
                );

                // Get remaining images ordered by sortOrder
                const remainingImages = await this.productImageRepository.find({
                    where: { productId: id },
                    order: { sortOrder: 'ASC' }
                });

                // Set the specified image as primary
                if (remainingImages.length > 0 && primaryImageIndex < remainingImages.length) {
                    const primaryImage = remainingImages[primaryImageIndex];
                    await this.productImageRepository.update(
                        { imageId: primaryImage.imageId },
                        { isPrimary: true }
                    );
                }
            }

            // Update productCount for categories
            await this.categoryService.updateProductCount(oldCategoryId);
            if (updateProductWithImagesDto.categoryId && updateProductWithImagesDto.categoryId !== oldCategoryId) {
                await this.categoryService.updateProductCount(updateProductWithImagesDto.categoryId);
            }

            // Return updated product with images
            const productWithImages = await this.productRepository.findOne({
                where: { productId: updatedProduct.productId },
                relations: ['images', 'category'],
            });

            if (!productWithImages) {
                throw new NotFoundException('Product not found after update');
            }

            return productWithImages;
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to update product with images');
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

    /**
     * Reindex all products in Elasticsearch
     * @returns Object containing success status and count of indexed products
     */
    async reindexAllProducts(): Promise<{ success: boolean; indexedCount: number; error?: string }> {
        try {
            // Get all products with their relations
            const products = await this.productRepository.find({
                relations: ['category', 'vendor'],
            });

            let indexedCount = 0;

            // Reindex each product
            for (const product of products) {
                const productDocument: any = {
                    id: product.productId,
                    name: product.productName,
                    description: product.description || '',
                    price: product.price,
                    categoryId: product.categoryId,
                    vendorId: product.vendorId || null,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt,
                };

                await this.indexProductInElasticsearch(productDocument);
                indexedCount++;
            }

            return {
                success: true,
                indexedCount,
            };
        } catch (error) {
            console.error('Error reindexing products:', error);
            return {
                success: false,
                indexedCount: 0,
                error: error.message || 'Failed to reindex products',
            };
        }
    }

    /**
 * Search for products using Elasticsearch with fallback to database search
 * @param query Search query string
 * @param categoryId Optional category ID to filter by
 * @param page Page number (1-based)
 * @param limit Number of items per page
 * @returns Paginated search results with product details
 */
    async searchProducts(
        query: string,
        categoryId?: number,
        page = 1,
        limit = 10,
    ): Promise<{
        data: any[];
        meta: { total: number; page: number; limit: number; totalPages: number };
    }> {
        // Validate input parameters
        if (!query || query.trim().length === 0) {
            throw new BadRequestException('Query string cannot be empty');
        }

        if (page < 1) {
            throw new BadRequestException('Page number must be greater than 0');
        }

        if (limit < 1 || limit > 100) {
            throw new BadRequestException('Limit must be between 1 and 100');
        }

        try {
            const searchResult = await this.searchProductsInElasticsearch(query, categoryId, page, limit);

            // Check if Elasticsearch search failed or returned no results
            if (!searchResult || !searchResult.success || !searchResult.data?.length) {
                console.warn('Elasticsearch search failed or returned no results, using fallback');
                return this.fallbackSearch(query, categoryId, page, limit);
            }

            // Extract product IDs from search results
            const productIds = searchResult.data
                .map((hit: any) => hit._source?.id)
                .filter((id: any) => id !== undefined && id !== null);

            if (productIds.length === 0) {
                console.warn('No valid product IDs found in search results, using fallback');
                return this.fallbackSearch(query, categoryId, page, limit);
            }

            // Fetch products from database
            const products = await this.productRepository.find({
                where: { productId: In(productIds) },
                relations: ['category', 'images'],
            });

            // Order products according to search result order
            const orderedProducts = productIds
                .map(id => products.find(p => p.productId === id))
                .filter(Boolean);

            return {
                data: orderedProducts,
                meta: {
                    total: orderedProducts.length,
                    page,
                    limit,
                    totalPages: Math.ceil(orderedProducts.length / limit),
                },
            };
        } catch (error) {
            console.error('Error searching products:', error);
            return this.fallbackSearch(query, categoryId, page, limit);
        }
    }

    /**
     * Search products in Elasticsearch with query building
     */
    async searchProductsInElasticsearch(
        query: string,
        categoryId?: number,
        page = 1,
        limit = 10
    ): Promise<IElasticsearchResponse<Array<{ _id: string; _source: ProductIndexDocument }>>> {
        // Validate query
        if (!query || query.trim().length === 0) {
            return {
                success: false,
                error: 'Query string cannot be empty',
                message: 'Please provide a search query',
                data: []
            };
        }

        const from = (page - 1) * limit;

        const searchBody: any = {
            query: {
                bool: {
                    must: [
                        {
                            multi_match: {
                                query: query.trim(),
                                fields: ['name^3', 'description'],
                                fuzziness: 'AUTO',
                                type: 'best_fields'
                            },
                        },
                    ],
                    filter: categoryId ? [{ term: { categoryId } }] : [],
                },
            },
            sort: [
                { _score: { order: 'desc' } },
                { createdAt: { order: 'desc' } },
            ],
            size: limit,
            from: from
        };

        try {
            const result = await this.searchInElasticsearch<ProductIndexDocument>(searchBody);

            // Ensure result has proper structure
            if (!result) {
                return {
                    success: false,
                    error: 'No response from Elasticsearch',
                    message: 'Search service unavailable',
                    data: []
                };
            }

            return result;
        } catch (error) {
            this.logger.error(`Search error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: 'Search failed',
                data: []
            };
        }
    }

    /**
     * Fallback search method using database when Elasticsearch is not available
     */
    private async fallbackSearch(
        query: string,
        categoryId?: number,
        page: number = 1,
        limit: number = 10
    ): Promise<{
        data: any[];
        meta: { total: number; page: number; limit: number; totalPages: number };
    }> {
        console.warn('Using fallback search for query:', query);
        const skip = (page - 1) * limit;
        const where: any = {};

        try {
            // Build search conditions
            if (query && query.trim().length > 0) {
                where.productName = Like(`%${query.trim()}%`);
            }

            if (categoryId && categoryId > 0) {
                where.categoryId = categoryId;
            }

            // Execute query
            const [products, total] = await this.productRepository.findAndCount({
                where,
                relations: ['category', 'images'],
                order: { createdAt: 'DESC' },
                skip,
                take: limit
            });

            return {
                data: products,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Fallback search error:', error);
            return {
                data: [],
                meta: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0
                }
            };
        }
    }
}
