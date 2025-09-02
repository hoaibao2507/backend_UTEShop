import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductImageController } from './product-image.controller';
import { ProductImageService } from './product-image.service';
import { ProductImage } from '../entities/product-image.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([ProductImage]), AuthModule],
    controllers: [ProductImageController],
    providers: [ProductImageService],
    exports: [ProductImageService],
})
export class ProductImageModule {}
