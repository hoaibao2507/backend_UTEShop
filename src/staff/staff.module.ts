import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StaffController } from './staff.controller';
import { StaffAuthController } from './staff-auth.controller';
import { StaffService } from './staff.service';
import { StaffAuthService } from './staff-auth.service';
import { User } from '../users/users.entity';
import { Admin } from '../entities/admin.entity';
import { Vendor } from '../entities/vendor.entity';
import { AdminService } from '../admin/admin.service';
import { VendorService } from '../vendor/vendor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Admin, Vendor]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  controllers: [StaffController, StaffAuthController],
  providers: [StaffService, StaffAuthService, AdminService, VendorService],
  exports: [StaffService, StaffAuthService],
})
export class StaffModule {}



