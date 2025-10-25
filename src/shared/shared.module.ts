import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { SharedElasticsearchService } from './services/elasticsearch.service';

@Module({
  imports: [
    ElasticsearchModule.register({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    }),
  ],
  providers: [SharedElasticsearchService],
  exports: [SharedElasticsearchService],
})
export class SharedModule {}
