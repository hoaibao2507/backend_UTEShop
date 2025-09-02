import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItemController } from './cart-item.controller';
import { CartItemService } from './cart-item.service';
import { CartItem } from '../entities/cart-item.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([CartItem]), AuthModule],
    controllers: [CartItemController],
    providers: [CartItemService],
    exports: [CartItemService],
})
export class CartItemModule {}
