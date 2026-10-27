import { jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { SeedService } from './seed.service.js';

describe('SeedService', () => {
  let service: SeedService;

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn((data) => ({ id: 'u-' + Math.random(), ...data })),
    save: jest.fn((data) => Promise.resolve(data)),
  };

  const mockMechanicRepo = {
    findOne: jest.fn(),
    create: jest.fn((data) => ({ id: 'm-' + Math.random(), ...data })),
    save: jest.fn((data) => Promise.resolve(data)),
  };

  const mockWorkshopRepo = {
    findOne: jest.fn(),
    create: jest.fn((data) => ({ id: 'w-' + Math.random(), ...data })),
    save: jest.fn((data) => Promise.resolve(data)),
  };

  const mockVehicleRepo = {
    findOne: jest.fn(),
    create: jest.fn((data) => ({ id: 'v-' + Math.random(), ...data })),
    save: jest.fn((data) => Promise.resolve(data)),
  };

  const mockMaintenanceRepo = {
    findOne: jest.fn(),
    create: jest.fn((data) => ({ id: 'mt-' + Math.random(), ...data })),
    save: jest.fn((data) => Promise.resolve(data)),
  };

  const mockConfig = {
    get: jest.fn((key) => {
      if (key === 'ADMIN_EMAIL') return 'admin@fleetcore.com';
      if (key === 'ADMIN_PASSWORD') return 'Admin12345!';
      return null;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SeedService(
      mockUserRepo as any,
      mockMechanicRepo as any,
      mockWorkshopRepo as any,
      mockVehicleRepo as any,
      mockMaintenanceRepo as any,
      mockConfig as any,
    );
  });

  it('ejecuta el seed e inserta todos los registros iniciales requeridos', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);
    mockMechanicRepo.findOne.mockResolvedValue(null);
    mockWorkshopRepo.findOne.mockResolvedValue(null);
    mockVehicleRepo.findOne.mockResolvedValue(null);
    mockMaintenanceRepo.findOne.mockResolvedValue(null);

    await service.runSeed();

    expect(mockUserRepo.save).toHaveBeenCalledTimes(3);
    expect(mockMechanicRepo.save).toHaveBeenCalledTimes(3);
    expect(mockWorkshopRepo.save).toHaveBeenCalledTimes(2);
    expect(mockVehicleRepo.save).toHaveBeenCalledTimes(4);
    expect(mockMaintenanceRepo.save).toHaveBeenCalledTimes(2);
  });

  it('es idempotente y no duplica registros si ya existen', async () => {
    mockUserRepo.findOne.mockResolvedValue({ id: 'exists' });
    mockMechanicRepo.findOne.mockResolvedValue({ id: 'exists' });
    mockWorkshopRepo.findOne.mockResolvedValue({ id: 'exists' });
    mockVehicleRepo.findOne.mockResolvedValue({ id: 'exists' });
    mockMaintenanceRepo.findOne.mockResolvedValue({ id: 'exists' });

    await service.runSeed();

    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockMechanicRepo.save).not.toHaveBeenCalled();
    expect(mockWorkshopRepo.save).not.toHaveBeenCalled();
    expect(mockVehicleRepo.save).not.toHaveBeenCalled();
    expect(mockMaintenanceRepo.save).not.toHaveBeenCalled();
  });
});
