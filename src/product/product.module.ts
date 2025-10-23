import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from '../entities/product.entity';
import { ProductImage } from '../entities/product-image.entity';
import { AuthModule } from '../auth/auth.module';
import { CategoryModule } from '../category/category.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, ProductImage]), 
        AuthModule, 
        forwardRef(() => CategoryModule),
        CloudinaryModule
    ],
    controllers: [ProductController],
    providers: [ProductService],
    exports: [ProductService],
})
export class ProductModule {}
