import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from '../entities/product.entity';
import { AuthModule } from '../auth/auth.module';
import { CategoryModule } from '../category/category.module';

@Module({
    imports: [TypeOrmModule.forFeature([Product]), AuthModule, forwardRef(() => CategoryModule)],
    controllers: [ProductController],
    providers: [ProductService],
    exports: [ProductService],
})
export class ProductModule {}
