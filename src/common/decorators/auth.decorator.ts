import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { Role } from '../enums/role.enum.js';
import { Roles } from './roles.decorator.js';

export const Auth = (...roles: Role[]) =>
  applyDecorators(
    Roles(...roles),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Token ausente o inválido' }),
    ApiForbiddenResponse({ description: 'Rol sin permisos' }),
  );
