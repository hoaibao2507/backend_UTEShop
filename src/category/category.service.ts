import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { SharedElasticsearchService, IElasticsearchResponse } from '../shared/services/elasticsearch.service';
import { CategoryIndexDocument } from '../shared/interfaces/elasticsearch.interface';

@Injectable()
export class CategoryService implements OnModuleInit {
    private readonly logger = new Logger(CategoryService.name);
    private readonly indexName = 'categories';

    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        private sharedElasticsearchService: SharedElasticsearchService,
    ) {
        this.initializeSearchIndex();
    }

    async onModuleInit() {
        this.logger.log('CategoryService initialized');
    }

    private async initializeSearchIndex() {
        try {
            await this.initializeElasticsearchIndex();
            console.log('Category Elasticsearch index initialized');
        } catch (error) {
            console.error('Failed to initialize Category Elasticsearch index:', error);
        }
    }

    // ==================== ELASTICSEARCH METHODS ====================

    /**
     * Initialize Elasticsearch index for categories
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
                productCount: { type: 'integer' },
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
                        stopwords: ['và', 'của', 'với', 'cho', 'từ', 'trong', 'để', 'là', 'có', 'được', 'này', 'đó', 'một', 'các', 'những', 'danh', 'mục', 'danh mục']
                    }
                }
            }
        };

        return this.sharedElasticsearchService.createIndex(this.indexName, mappings, settings);
    }

    /**
     * Index a category document in Elasticsearch
     */
    async indexCategoryInElasticsearch(category: CategoryIndexDocument): Promise<IElasticsearchResponse> {
        return this.sharedElasticsearchService.indexDocument(this.indexName, category.id.toString(), category);
    }

    /**
     * Search categories in Elasticsearch
     */
    async searchCategoriesInElasticsearch(
        query: string,
        page = 1,
        limit = 10
    ): Promise<IElasticsearchResponse<Array<{ _id: string; _source: CategoryIndexDocument }>>> {
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
            const result = await this.sharedElasticsearchService.search<CategoryIndexDocument>(this.indexName, searchBody);

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
            this.logger.error(`Category search error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: 'Search failed',
                data: []
            };
        }
    }

    /**
     * Update a category document in Elasticsearch
     */
    async updateCategoryInElasticsearch<T = any>(
        id: string,
        document: Partial<T>,
    ): Promise<IElasticsearchResponse> {
        return this.sharedElasticsearchService.updateDocument(this.indexName, id, document);
    }

    /**
     * Delete a category document from Elasticsearch
     */
    async deleteCategoryFromElasticsearch(id: string): Promise<IElasticsearchResponse> {
        return this.sharedElasticsearchService.deleteDocument(this.indexName, id);
    }

    /**
     * Search categories with fallback to database
     */
    async searchCategories(
        query: string,
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
            const searchResult = await this.searchCategoriesInElasticsearch(query, page, limit);

            // Check if Elasticsearch search failed or returned no results
            if (!searchResult || !searchResult.success || !searchResult.data?.length) {
                console.warn('Elasticsearch search failed or returned no results, using fallback');
                return this.fallbackCategorySearch(query, page, limit);
            }

            // Extract category IDs from search results
            const categoryIds = searchResult.data
                .map((hit: any) => hit._source?.id)
                .filter((id: any) => id !== undefined && id !== null);

            if (categoryIds.length === 0) {
                console.warn('No valid category IDs found in search results, using fallback');
                return this.fallbackCategorySearch(query, page, limit);
            }

            // Fetch categories from database
            const categories = await this.categoryRepository.find({
                where: { categoryId: In(categoryIds) },
            });

            // Order categories according to search result order
            const orderedCategories = categoryIds
                .map(id => categories.find(c => c.categoryId === id))
                .filter(Boolean);

            return {
                data: orderedCategories,
                meta: {
                    total: orderedCategories.length,
                    page,
                    limit,
                    totalPages: Math.ceil(orderedCategories.length / limit),
                },
            };
        } catch (error) {
            console.error('Error searching categories:', error);
            return this.fallbackCategorySearch(query, page, limit);
        }
    }

    /**
     * Fallback search method using database when Elasticsearch is not available
     */
    private async fallbackCategorySearch(
        query: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{
        data: any[];
        meta: { total: number; page: number; limit: number; totalPages: number };
    }> {
        console.warn('Using fallback category search for query:', query);
        const skip = (page - 1) * limit;

        try {
            const [categories, total] = await this.categoryRepository.findAndCount({
                where: {
                    categoryName: Like(`%${query.trim()}%`)
                },
                order: { createdAt: 'DESC' },
                skip,
                take: limit
            });

            return {
                data: categories,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Fallback category search error:', error);
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

    async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
        try {
            const category = this.categoryRepository.create(createCategoryDto);
            const savedCategory = await this.categoryRepository.save(category);
            
            // Index to Elasticsearch
            try {
                const categoryDocument: CategoryIndexDocument = {
                    id: savedCategory.categoryId,
                    name: savedCategory.categoryName,
                    description: savedCategory.description || '',
                    productCount: 0,
                    createdAt: savedCategory.createdAt,
                    updatedAt: savedCategory.createdAt, // Use createdAt as updatedAt since Category doesn't have updatedAt
                };
                await this.indexCategoryInElasticsearch(categoryDocument);
            } catch (error) {
                console.error('Failed to index category to Elasticsearch:', error);
            }
            
            return savedCategory;
        } catch (error) {
            throw new BadRequestException('Failed to create category');
        }
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ categories: Category[]; total: number; page: number; limit: number }> {
        const [categories, total] = await this.categoryRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        // Tính toán productCount cho từng category
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const productCount = await this.productRepository
                    .createQueryBuilder('product')
                    .where('product.categoryId = :categoryId', { categoryId: category.categoryId })
                    .getCount();

                return {
                    ...category,
                    productCount,
                };
            })
        );

        return {
            categories: categoriesWithCount,
            total,
            page,
            limit,
        };
    }

    async findOne(id: number): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: { categoryId: id },
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        // Tính toán productCount cho category
        const productCount = await this.productRepository
            .createQueryBuilder('product')
            .where('product.categoryId = :categoryId', { categoryId: id })
            .getCount();

        return {
            ...category,
            productCount,
        };
    }

    async findProductsByCategory(categoryId: number, page: number = 1, limit: number = 10) {
        const category = await this.findOne(categoryId);
        
        const [products, total] = await this.categoryRepository
            .createQueryBuilder('category')
            .leftJoinAndSelect('category.products', 'product')
            .where('category.categoryId = :categoryId', { categoryId })
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return {
            category,
            products: products[0]?.products || [],
            total,
            page,
            limit,
        };
    }

    async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
        const category = await this.findOne(id);
        
        try {
            Object.assign(category, updateCategoryDto);
            const updatedCategory = await this.categoryRepository.save(category);
            
            // Update in Elasticsearch
            try {
                const categoryDocument: Partial<CategoryIndexDocument> = {
                    name: updatedCategory.categoryName,
                    description: updatedCategory.description || '',
                    updatedAt: updatedCategory.createdAt, // Use createdAt as updatedAt since Category doesn't have updatedAt
                };
                await this.updateCategoryInElasticsearch(id.toString(), categoryDocument);
            } catch (error) {
                console.error('Failed to update category in Elasticsearch:', error);
            }
            
            return updatedCategory;
        } catch (error) {
            throw new BadRequestException('Failed to update category');
        }
    }

    async remove(id: number): Promise<void> {
        const category = await this.findOne(id);
        
        try {
            await this.categoryRepository.remove(category);
            
            // Delete from Elasticsearch
            try {
                await this.deleteCategoryFromElasticsearch(id.toString());
            } catch (error) {
                console.error('Failed to delete category from Elasticsearch:', error);
            }
        } catch (error) {
            throw new BadRequestException('Cannot delete category with existing products');
        }
    }

    // Method để cập nhật productCount trong database
    async updateProductCount(categoryId: number): Promise<void> {
        const productCount = await this.productRepository
            .createQueryBuilder('product')
            .where('product.categoryId = :categoryId', { categoryId })
            .getCount();

        await this.categoryRepository
            .createQueryBuilder()
            .update(Category)
            .set({ productCount })
            .where('categoryId = :categoryId', { categoryId })
            .execute();
    }

    // Method để cập nhật productCount cho tất cả categories
    async updateAllProductCounts(): Promise<void> {
        const categories = await this.categoryRepository.find();
        
        for (const category of categories) {
            await this.updateProductCount(category.categoryId);
        }
    }

    /**
     * Reindex all categories in Elasticsearch
     */
    async reindexAllCategories(): Promise<{ success: boolean; indexedCount: number; error?: string }> {
        try {
            const categories = await this.categoryRepository.find();

            let indexedCount = 0;

            // Reindex each category
            for (const category of categories) {
                const categoryDocument: CategoryIndexDocument = {
                    id: category.categoryId,
                    name: category.categoryName,
                    description: category.description || '',
                    productCount: category.productCount || 0,
                    createdAt: category.createdAt,
                    updatedAt: category.createdAt, // Use createdAt as updatedAt since Category doesn't have updatedAt
                };

                await this.indexCategoryInElasticsearch(categoryDocument);
                indexedCount++;
            }

            return {
                success: true,
                indexedCount,
            };
        } catch (error) {
            console.error('Error reindexing categories:', error);
            return {
                success: false,
                indexedCount: 0,
                error: error.message || 'Failed to reindex categories',
            };
        }
    }
}
