import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { VendorStatus } from '../../entities/vendor.entity';
import { AdminRole } from '../../entities/admin.entity';

@Injectable()
export class VendorRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.role) {
      throw new ForbiddenException('Không có quyền truy cập');
    }

    // Admin có quyền truy cập tất cả endpoints của vendor
    if (user.type === 'admin') {
      return true;
    }

    // Vendor chỉ có quyền truy cập các endpoint của mình
    if (user.type === 'vendor') {
      // Vendor có thể truy cập profile và cập nhật thông tin của mình
      return true;
    }

    throw new ForbiddenException('Không có quyền truy cập');
  }
}
