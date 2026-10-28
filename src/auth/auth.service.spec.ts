import { jest } from '@jest/globals';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { compare, hash } from 'bcryptjs';
import { Role } from '../common/enums/role.enum.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;

  const usersService = {
    findByEmail: jest.fn<(...args: any[]) => Promise<any>>(),
    findByEmailWithPassword: jest.fn<(...args: any[]) => Promise<any>>(),
    create: jest.fn<(...args: any[]) => any>(),
  };

  const jwtService = {
    signAsync: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue('jwt-fake-token-fleetcore'),
  };

  const dto = {
    name: 'Carlos Gómez',
    email: 'carlos@fleetcore.com',
    password: 'Tech12345!',
    role: Role.TECHNICIAN,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('almacena la contraseña hasheada y retorna token JWT', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation(async (data: Record<string, unknown>) => ({
        id: 'u1',
        ...data,
      }));

      const result = await service.register(dto);
      const savedUser = usersService.create.mock.calls[0][0];

      expect(savedUser.password).not.toBe(dto.password);
      expect(await compare(dto.password, savedUser.password)).toBe(true);
      expect(result.accessToken).toBe('jwt-fake-token-fleetcore');
      expect(result.user.email).toBe(dto.email);
    });

    it('lanza ConflictException si el correo electrónico ya existe', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'u1' });
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('retorna token JWT con credenciales válidas validadas con bcryptjs', async () => {
      const hashedPassword = await hash(dto.password, 4);
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'u1',
        name: dto.name,
        email: dto.email,
        role: Role.TECHNICIAN,
        password: hashedPassword,
      });

      const result = await service.login({
        email: dto.email,
        password: dto.password,
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: dto.email,
        role: Role.TECHNICIAN,
      });
      expect(result.accessToken).toBe('jwt-fake-token-fleetcore');
    });

    it('lanza UnauthorizedException si la contraseña es incorrecta', async () => {
      const hashedPassword = await hash('OtraContraseña123!', 4);
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'u1',
        password: hashedPassword,
      });

      await expect(
        service.login({ email: dto.email, password: dto.password }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el usuario no existe', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login({ email: dto.email, password: dto.password }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
