import { Injectable, Logger } from '@nestjs/common';
import { ElasticService } from '../elasticsearch/elasticsearch.service';

export interface ProductIndexDocument {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  vendorId: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProductSearchService {
  private readonly indexName = 'products';
  private readonly logger = new Logger(ProductSearchService.name);

  constructor(private readonly elasticService: ElasticService) { }

  async initializeIndex() {
    const indexBody = {
      mappings: {
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
      },
      settings: {
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
      }
    };

    return this.elasticService.createIndex(this.indexName, indexBody);
  }

  async indexProduct(product: ProductIndexDocument) {
    return this.elasticService.indexDocument(
      this.indexName,
      product.id.toString(),
      product
    );
  }

  async search(query: string, categoryId?: number, page = 1, limit = 10) {
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
      const result = await this.elasticService.search<ProductIndexDocument>(
        this.indexName,
        searchBody
      );

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

  async update(product: Partial<ProductIndexDocument> & { id: number }) {
    return this.elasticService.updateDocument(
      this.indexName,
      product.id.toString(),
      product
    );
  }

  async delete(productId: number) {
    return this.elasticService.deleteDocument(
      this.indexName,
      productId.toString()
    );
  }
}
