import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderPaymentController } from './order-payment.controller';
import { OrderPaymentService } from './order-payment.service';
import { Order } from '../entities/order.entity';
<<<<<<< HEAD
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Product } from '../entities/product.entity';
import { PaymentMethod as PaymentMethodEntity } from '../entities/payment-method.entity';
=======
import { OrderTracking } from '../entities/order-tracking.entity';
>>>>>>> origin/main
import { AuthModule } from '../auth/auth.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
    imports: [
<<<<<<< HEAD
        TypeOrmModule.forFeature([Order, Cart, CartItem, Product, PaymentMethodEntity]), 
        AuthModule,
        PaymentModule
    ],
    controllers: [OrderController, OrderPaymentController],
    providers: [OrderService, OrderPaymentService],
    exports: [OrderService, OrderPaymentService],
=======
    TypeOrmModule.forFeature([Order, OrderTracking]),
    AuthModule,
    ],
    controllers: [OrderController],
    providers: [OrderService],
    exports: [OrderService],
>>>>>>> origin/main
})
export class OrderModule {}
