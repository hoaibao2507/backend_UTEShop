import { Module } from '@nestjs/common';
import { ElasticsearchController } from './elasticsearch.controller';
import { ProductModule } from '../product/product.module';
import { CategoryModule } from '../category/category.module';

@Module({
    imports: [
        ProductModule,
        CategoryModule,
    ],
    controllers: [ElasticsearchController],
})
export class ElasticsearchModule {}
