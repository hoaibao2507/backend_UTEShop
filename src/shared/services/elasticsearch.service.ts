import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { IElasticsearchResponse, IndexMapping, IndexSettings } from '../interfaces/elasticsearch.interface';

// Re-export interfaces for backward compatibility
export type { IElasticsearchResponse, IndexMapping, IndexSettings } from '../interfaces/elasticsearch.interface';

@Injectable()
export class SharedElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(SharedElasticsearchService.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async onModuleInit() {
    try {
      await this.elasticsearchService.ping();
      this.logger.log('✅ Connected to Elasticsearch successfully');
    } catch (error: any) {
      this.logger.error(`❌ Failed to connect to Elasticsearch: ${error.message}`);
    }
  }

  /**
   * Create Elasticsearch index if it doesn't exist
   */
  async createIndex(
    index: string, 
    mappings?: IndexMapping, 
    settings?: IndexSettings
  ): Promise<IElasticsearchResponse> {
    try {
      const exists = await this.elasticsearchService.indices.exists({ index });

      if (exists) {
        return { success: true, message: `Index "${index}" already exists` };
      }

      const body: any = {};
      if (mappings) {
        body.mappings = mappings;
      }
      if (settings) {
        body.settings = settings;
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

  /**
   * Index a document in Elasticsearch
   */
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

  /**
   * Search documents in Elasticsearch
   */
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

  /**
   * Update a document in Elasticsearch
   */
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

  /**
   * Delete a document from Elasticsearch
   */
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

  /**
   * Check if index exists
   */
  async indexExists(index: string): Promise<boolean> {
    try {
      return await this.elasticsearchService.indices.exists({ index });
    } catch (error) {
      this.logger.error(`Error checking index existence ${index}: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete index
   */
  async deleteIndex(index: string): Promise<IElasticsearchResponse> {
    try {
      const result = await this.elasticsearchService.indices.delete({ index });
      return {
        success: result.acknowledged,
        data: result,
        message: result.acknowledged ? `Index "${index}" deleted successfully` : `Failed to delete index "${index}"`,
      };
    } catch (error: any) {
      this.logger.error(`Error deleting index ${index}: ${error.message}`);
      return { success: false, error: error.message, message: 'Failed to delete index' };
    }
  }

  /**
   * Get index mapping
   */
  async getIndexMapping(index: string): Promise<IElasticsearchResponse> {
    try {
      const result = await this.elasticsearchService.indices.getMapping({ index });
      return {
        success: true,
        data: result,
        message: 'Index mapping retrieved successfully',
      };
    } catch (error: any) {
      this.logger.error(`Error getting index mapping ${index}: ${error.message}`);
      return { success: false, error: error.message, message: 'Failed to get index mapping' };
    }
  }
}
