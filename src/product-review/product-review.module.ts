import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductReviewController } from './product-review.controller';
import { ProductReviewService } from './product-review.service';
import { ProductReview } from '../entities/product-review.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([ProductReview]), AuthModule],
    controllers: [ProductReviewController],
    providers: [ProductReviewService],
    exports: [ProductReviewService],
})
export class ProductReviewModule {}
