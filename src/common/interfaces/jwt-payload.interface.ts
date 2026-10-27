import type { Request } from 'express';
import type { Role } from '../enums/role.enum.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export type AuthRequest = Request & { user: JwtPayload };
