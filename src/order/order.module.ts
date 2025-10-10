import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderPaymentController } from './order-payment.controller';
import { OrderPaymentService } from './order-payment.service';
import { Order } from '../entities/order.entity';
import { OrderDetail } from '../entities/order-detail.entity';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Product } from '../entities/product.entity';
import { PaymentMethod as PaymentMethodEntity } from '../entities/payment-method.entity';
import { OrderTracking } from '../entities/order-tracking.entity';
import { AuthModule } from '../auth/auth.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderDetail, Cart, CartItem, Product, PaymentMethodEntity, OrderTracking]), 
        AuthModule,
        PaymentModule
    ],
    controllers: [OrderController, OrderPaymentController],
    providers: [OrderService, OrderPaymentService],
    exports: [OrderService, OrderPaymentService],
})
export class OrderModule {}
