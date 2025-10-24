import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule as NestElasticsearchModule } from '@nestjs/elasticsearch';
import { ElasticsearchService } from './elasticsearch.service';

@Module({
  imports: [
    NestElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: configService.get('ELASTICSEARCH_NODE') || 'http://localhost:9200',
        auth: {
          username: configService.get('ELASTICSEARCH_USERNAME') || '',
          password: configService.get('ELASTICSEARCH_PASSWORD') || '',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ElasticsearchService],
  exports: [NestElasticsearchModule, ElasticsearchService],
})
export class ElasticsearchModule {}
