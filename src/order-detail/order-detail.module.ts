import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderDetailController } from './order-detail.controller';
import { OrderDetailService } from './order-detail.service';
import { OrderDetail } from '../entities/order-detail.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([OrderDetail]), AuthModule],
    controllers: [OrderDetailController],
    providers: [OrderDetailService],
    exports: [OrderDetailService],
})
export class OrderDetailModule {}
