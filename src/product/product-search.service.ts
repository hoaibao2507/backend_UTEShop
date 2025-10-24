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
    const from = (page - 1) * limit;

    const searchBody: any = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['name^3', 'description'],
                fuzziness: 'AUTO',
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
    };

    return this.elasticService.search<ProductIndexDocument>(
      this.indexName,
      searchBody,
      limit,
      from,
    );
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
