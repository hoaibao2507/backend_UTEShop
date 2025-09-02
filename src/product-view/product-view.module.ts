import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductViewController } from './product-view.controller';
import { ProductViewService } from './product-view.service';
import { ProductView } from '../entities/product-view.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([ProductView]), AuthModule],
    controllers: [ProductViewController],
    providers: [ProductViewService],
    exports: [ProductViewService],
})
export class ProductViewModule {}
