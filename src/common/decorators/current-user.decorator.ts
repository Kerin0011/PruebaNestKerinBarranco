import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthRequest, JwtPayload } from '../interfaces/jwt-payload.interface.js';

export const ActiveUser = createParamDecorator(
  (field: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const { user } = ctx.switchToHttp().getRequest<AuthRequest>();
    return field ? user?.[field] : user;
  },
);
export const CurrentUser = ActiveUser;
