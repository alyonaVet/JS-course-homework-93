import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserDocument } from '../schemas/user.schema';
import { Role } from '../users/role.enum';
import { ROLES_KEY } from '../users/roles.decorator';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    const user = request.user as UserDocument;

    if (!user) {
      return false;
    }

    const hasRole = () => requiredRoles.includes(user.role as Role);

    if (!hasRole()) {
      return false;
    }

    return true;
  }
}
