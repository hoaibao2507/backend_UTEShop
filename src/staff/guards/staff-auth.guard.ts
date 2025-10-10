import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StaffService } from '../staff.service';

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private staffService: StaffService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token không được cung cấp');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // Check if token is for staff
      if (payload.type !== 'staff') {
        throw new UnauthorizedException('Token không hợp lệ cho staff');
      }

      // Verify staff exists and is active
      const staff = await this.staffService.findOne(payload.sub);
      if (!staff.isActive) {
        throw new UnauthorizedException('Tài khoản staff đã bị vô hiệu hóa');
      }

      request['user'] = {
        id: payload.sub,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.role,
      };
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

