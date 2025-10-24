import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

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

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

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
              filter: ['lowercase', 'asciifolding', 'vi_stop', 'vi_stemmer']
            }
          },
          filter: {
            vi_stop: {
              type: 'stop',
              stopwords: '_vietnamese_'
            },
            vi_stemmer: {
              type: 'stemmer',
              name: 'vietnamese'
            }
          }
        }
      }
    };

    return this.elasticsearchService.createIndex(this.indexName, indexBody);
  }

  async indexProduct(product: ProductIndexDocument) {
    return this.elasticsearchService.indexDocument(
      this.indexName,
      product.id.toString(),
      product
    );
  }

  async searchProducts(query: string, categoryId?: number, page = 1, limit = 10) {
    const from = (page - 1) * limit;
    
    const searchQuery: any = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['name^3', 'description'],
                fuzziness: 'AUTO'
              }
            }
          ]
        }
      },
      sort: [
        { _score: { order: 'desc' } },
        { createdAt: { order: 'desc' } }
      ]
    };

    if (categoryId) {
      searchQuery.query.bool.filter = [
        { term: { categoryId } }
      ];
    }

    return this.elasticsearchService.search<ProductIndexDocument>(
      this.indexName,
      searchQuery,
      limit,
      from
    );
  }

  async updateProduct(product: Partial<ProductIndexDocument> & { id: number }) {
    return this.elasticsearchService.updateDocument(
      this.indexName,
      product.id.toString(),
      product
    );
  }

  async deleteProduct(productId: number) {
    return this.elasticsearchService.deleteDocument(
      this.indexName,
      productId.toString()
    );
  }
}
