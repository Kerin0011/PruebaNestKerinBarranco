import { jest } from '@jest/globals';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../enums/role.enum.js';
import { ApiKeyGuard } from './api-key.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RolesGuard } from './roles.guard.js';

describe('Guards', () => {
  describe('JwtAuthGuard', () => {
    it('permite el acceso sin token si el endpoint tiene el decorador @PublicRoute()', async () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(true),
      } as unknown as Reflector;
      const jwt = {} as JwtService;
      const guard = new JwtAuthGuard(jwt, reflector);

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      const canActivate = await guard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it('lanza UnauthorizedException si no se provee cabecera Authorization Bearer', async () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      } as unknown as Reflector;
      const jwt = {} as JwtService;
      const guard = new JwtAuthGuard(jwt, reflector);

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('valida el token y adjunta el usuario a la petición', async () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      } as unknown as Reflector;
      const jwt = {
        verifyAsync: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue({ sub: 'u1', role: Role.ADMIN }),
      } as unknown as JwtService;
      const guard = new JwtAuthGuard(jwt, reflector);

      const req: Record<string, unknown> = {
        headers: { authorization: 'Bearer token-valido' },
      };

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => req,
        }),
      } as unknown as ExecutionContext;

      const canActivate = await guard.canActivate(context);
      expect(canActivate).toBe(true);
      expect(req.user).toEqual({ sub: 'u1', role: Role.ADMIN });
    });
  });

  describe('RolesGuard', () => {
    it('permite el acceso si no hay restricción de roles', () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(null),
      } as unknown as Reflector;
      const guard = new RolesGuard(reflector);

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('permite el acceso si el usuario tiene el rol requerido', () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]),
      } as unknown as Reflector;
      const guard = new RolesGuard(reflector);

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: Role.ADMIN } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('lanza ForbiddenException si el rol del usuario no coincide', () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]),
      } as unknown as Reflector;
      const guard = new RolesGuard(reflector);

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: Role.TECHNICIAN } }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('ApiKeyGuard', () => {
    const config = {
      get: jest.fn().mockReturnValue('fleetcore-secret-key'),
    };
    const guard = new ApiKeyGuard(config as any);

    it('permite el acceso cuando la cabecera x-api-key coincide', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: { 'x-api-key': 'fleetcore-secret-key' } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('lanza UnauthorizedException cuando la cabecera x-api-key es errónea o falta', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: { 'x-api-key': 'clave-invalida' } }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });
});
