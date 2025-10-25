import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from '../product/product.service';
import { CategoryService } from '../category/category.service';

@ApiTags('elasticsearch')
@Controller('elasticsearch')
export class ElasticsearchController {
    constructor(
        private readonly productService: ProductService,
        private readonly categoryService: CategoryService,
    ) {}

    @Post('reindex-all')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Đồng bộ lại toàn bộ chỉ mục tìm kiếm', 
        description: 'Đồng bộ lại tất cả entities (products, categories) vào Elasticsearch (yêu cầu xác thực)' 
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Đồng bộ thành công',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                results: {
                    type: 'object',
                    properties: {
                        products: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean' },
                                indexedCount: { type: 'number' },
                                error: { type: 'string' }
                            }
                        },
                        categories: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean' },
                                indexedCount: { type: 'number' },
                                error: { type: 'string' }
                            }
                        }
                    }
                },
                totalIndexed: { type: 'number' },
                totalErrors: { type: 'number' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async reindexAll() {
        try {
            console.log('Starting full reindex process...');
            
            // Reindex products and categories in parallel
            const [productsResult, categoriesResult] = await Promise.all([
                this.productService.reindexAllProducts(),
                this.categoryService.reindexAllCategories()
            ]);

            const totalIndexed = productsResult.indexedCount + categoriesResult.indexedCount;
            const totalErrors = (productsResult.success ? 0 : 1) + (categoriesResult.success ? 0 : 1);

            const result = {
                success: productsResult.success && categoriesResult.success,
                message: `Reindex completed. Total indexed: ${totalIndexed}, Errors: ${totalErrors}`,
                results: {
                    products: productsResult,
                    categories: categoriesResult
                },
                totalIndexed,
                totalErrors
            };

            console.log('Full reindex process completed:', result);
            return result;

        } catch (error) {
            console.error('Error during full reindex:', error);
            return {
                success: false,
                message: 'Failed to complete reindex process',
                error: error.message,
                results: {
                    products: { success: false, indexedCount: 0, error: error.message },
                    categories: { success: false, indexedCount: 0, error: error.message }
                },
                totalIndexed: 0,
                totalErrors: 2
            };
        }
    }

    @Post('reindex-products')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Đồng bộ lại chỉ mục sản phẩm', 
        description: 'Đồng bộ lại toàn bộ sản phẩm vào Elasticsearch (yêu cầu xác thực)' 
    })
    @ApiResponse({ status: 200, description: 'Đồng bộ sản phẩm thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async reindexProducts() {
        return this.productService.reindexAllProducts();
    }

    @Post('reindex-categories')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Đồng bộ lại chỉ mục danh mục', 
        description: 'Đồng bộ lại toàn bộ danh mục vào Elasticsearch (yêu cầu xác thực)' 
    })
    @ApiResponse({ status: 200, description: 'Đồng bộ danh mục thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async reindexCategories() {
        return this.categoryService.reindexAllCategories();
    }
}
