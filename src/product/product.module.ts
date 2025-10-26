import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from '../entities/product.entity';
import { ProductImage } from '../entities/product-image.entity';
import { ProductView } from '../entities/product-view.entity';
import { ProductReview } from '../entities/product-review.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Wishlist } from '../entities/wishlist.entity';
import { OrderDetail } from '../entities/order-detail.entity';
import { AuthModule } from '../auth/auth.module';
import { CategoryModule } from '../category/category.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product, 
            ProductImage,
            ProductView,
            ProductReview,
            CartItem,
            Wishlist,
            OrderDetail
        ]), 
        SharedModule,
        AuthModule, 
        forwardRef(() => CategoryModule),
        CloudinaryModule
    ],
    controllers: [ProductController],
    providers: [ProductService],
    exports: [ProductService],
})
export class ProductModule {}
