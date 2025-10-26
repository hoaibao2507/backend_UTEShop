import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StaffController } from './staff.controller';
import { StaffAuthController } from './staff-auth.controller';
import { StaffService } from './staff.service';
import { StaffAuthService } from './staff-auth.service';
import { StaffAuthGuard } from './guards/staff-auth.guard';
import { User } from '../users/users.entity';
import { AdminModule } from '../admin/admin.module';
import { VendorModule } from '../vendor/vendor.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AdminModule,
    VendorModule,
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
  providers: [StaffService, StaffAuthService, StaffAuthGuard],
  exports: [StaffService, StaffAuthService],
})
export class StaffModule {}



