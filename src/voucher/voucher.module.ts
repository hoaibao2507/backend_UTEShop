import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from '../entities/voucher.entity';
import { OrderVoucher } from '../entities/order-voucher.entity';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher, OrderVoucher])],
  providers: [VoucherService],
  controllers: [VoucherController],
})
export class VoucherModule {}
