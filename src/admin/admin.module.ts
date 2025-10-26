import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AdminService } from './admin.service';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminRoleGuard } from './guards/admin-role.guard';
import { Admin } from '../entities/admin.entity';
import { User } from '../users/users.entity';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { Voucher } from '../entities/voucher.entity';
import { Order } from '../entities/order.entity';
import { ProductView } from '../entities/product-view.entity';
import { Wishlist } from '../entities/wishlist.entity';
import { ProductReview } from '../entities/product-review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Admin, 
      User, 
      Product, 
      Category, 
      Voucher, 
      Order, 
      ProductView, 
      Wishlist, 
      ProductReview
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  controllers: [AdminController, AdminAuthController],
  providers: [AdminService, AdminAuthService, AdminAuthGuard, AdminRoleGuard],
  exports: [AdminService, AdminAuthService],
})
export class AdminModule {}
