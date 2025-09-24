import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentWebhookController } from './payment-webhook.controller';
import { PaymentGatewayService } from './payment-gateway.service';
import { Payment } from '../entities/payment.entity';
import { PaymentMethod as PaymentMethodEntity } from '../entities/payment-method.entity';
import { Order } from '../entities/order.entity';
import { PaymentMethodModule } from '../payment-method/payment-method.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentMethodEntity, Order]),
    PaymentMethodModule,
  ],
  controllers: [PaymentController, PaymentWebhookController],
  providers: [PaymentService, PaymentGatewayService],
  exports: [PaymentService, PaymentGatewayService],
})
export class PaymentModule {}
