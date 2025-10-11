import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/users.entity';
import { AdminRole } from '../../entities/admin.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class StaffRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.role) {
      throw new ForbiddenException('Không có quyền truy cập');
    }

    // Admin và Vendor có quyền truy cập tất cả endpoints của staff
    if (user.type === 'admin' || user.type === 'vendor') {
      return true;
    }

    // Staff chỉ có quyền truy cập theo role của mình
    const hasRole = requiredRoles.some((role) => user.role === role);
    
    if (!hasRole) {
      throw new ForbiddenException('Không có quyền truy cập');
    }

    return true;
  }
}



