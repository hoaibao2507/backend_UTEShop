import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VendorController } from './vendor.controller';
import { VendorAuthController } from './vendor-auth.controller';
import { VendorService } from './vendor.service';
import { VendorAuthService } from './vendor-auth.service';
import { Vendor } from '../entities/vendor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vendor]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  controllers: [VendorController, VendorAuthController],
  providers: [VendorService, VendorAuthService],
  exports: [VendorService, VendorAuthService],
})
export class VendorModule {}
