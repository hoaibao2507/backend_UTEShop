import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

export interface IElasticsearchResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

@Injectable()
export class ElasticService implements OnModuleInit {
  private readonly logger = new Logger(ElasticService.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async onModuleInit() {
    try {
      await this.elasticsearchService.ping();
      this.logger.log('✅ Connected to Elasticsearch successfully');
    } catch (error: any) {
      this.logger.error(`❌ Failed to connect to Elasticsearch: ${error.message}`);
      // throw new Error(`Failed to connect to Elasticsearch: ${error.message}`);
    }
  }

  /** 🔹 Tạo index nếu chưa có */
  async createIndex(index: string, body?: Record<string, any>): Promise<IElasticsearchResponse> {
    try {
      const exists = await this.elasticsearchService.indices.exists({ index });

      if (exists) {
        return { success: true, message: `Index "${index}" already exists` };
      }

      const response = await this.elasticsearchService.indices.create({ index, body });

      return {
        success: response.acknowledged,
        data: response,
        message: response.acknowledged
          ? `Index "${index}" created successfully`
          : `Failed to create index "${index}"`,
      };
    } catch (error: any) {
      this.logger.error(`Error creating index ${index}: ${error.message}`);
      return { success: false, error: error.message, message: 'Failed to create index' };
    }
  }

  /** 🔹 Thêm hoặc cập nhật document */
  async indexDocument<T = any>(
    index: string,
    id: string,
    document: T,
  ): Promise<IElasticsearchResponse> {
    try {
      const result = await this.elasticsearchService.index({
        index,
        id,
        document: document as any,
        refresh: 'wait_for',
      });

      return {
        success: ['created', 'updated'].includes(result.result),
        data: result,
        message: `Document ${result.result}`,
      };
    } catch (error: any) {
      this.logger.error(`Error indexing document in ${index}: ${error.message}`);
      return { success: false, error: error.message, message: 'Failed to index document' };
    }
  }

  /** 🔹 Tìm kiếm document */
  async search<T = any>(
    index: string,
    searchBody: Record<string, any>,
  ): Promise<IElasticsearchResponse<Array<{ _id: string; _source: T }>>> {
    try {
      const result = await this.elasticsearchService.search({
        index,
        body: searchBody,
      });

      return {
        success: true,
        data: result.hits.hits as any,
        message: 'Search completed successfully',
      };
    } catch (error: any) {
      this.logger.error(`Error searching in index ${index}: ${error.message}`);
      return { success: false, error: error.message, message: 'Search failed' };
    }
  }

  /** 🔹 Cập nhật document */
  async updateDocument<T = any>(
    index: string,
    id: string,
    document: Partial<T>,
  ): Promise<IElasticsearchResponse> {
    try {
      const result = await this.elasticsearchService.update({
        index,
        id,
        doc: document as any,
        refresh: 'wait_for',
      });

      return {
        success: ['updated', 'noop'].includes(result.result),
        data: result,
        message: 'Document updated successfully',
      };
    } catch (error: any) {
      this.logger.error(`Error updating document in ${index}: ${error.message}`);
      return { success: false, error: error.message, message: 'Failed to update document' };
    }
  }

  /** 🔹 Xóa document */
  async deleteDocument(index: string, id: string): Promise<IElasticsearchResponse> {
    try {
      const result = await this.elasticsearchService.delete({
        index,
        id,
        refresh: 'wait_for',
      });

      return {
        success: result.result === 'deleted',
        data: result,
        message: 'Document deleted successfully',
      };
    } catch (error: any) {
      this.logger.error(`Error deleting document from ${index}: ${error.message}`);
      return { success: false, error: error.message, message: 'Failed to delete document' };
    }
  }
}
