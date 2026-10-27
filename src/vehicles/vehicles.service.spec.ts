import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VehicleStatus } from '../common/enums/vehicle-status.enum.js';
import { Maintenance } from '../maintenances/entities/maintenance.entity.js';
import { Vehicle } from './entities/vehicle.entity.js';
import { VehiclesService } from './vehicles.service.js';

describe('VehiclesService', () => {
  let service: VehiclesService;

  const mockRepo = {
    findOne: jest.fn(),
    create: jest.fn((data) => ({ id: 'v1', ...data })),
    save: jest.fn((v) => Promise.resolve(v)),
    softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn(),
  };

  const mockMaintenanceRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: getRepositoryToken(Vehicle), useValue: mockRepo },
        { provide: getRepositoryToken(Maintenance), useValue: mockMaintenanceRepo },
      ],
    }).compile();

    service = moduleRef.get(VehiclesService);
  });

  describe('create', () => {
    it('crea un vehículo convirtiendo la placa a mayúsculas', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const dto = {
        plate: 'xyz123',
        brand: 'Toyota',
        model: 'Hilux',
        year: 2022,
        mileage: 40000,
      };

      const result = await service.create(dto);
      expect(result.plate).toBe('XYZ123');
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('rechaza la creación si la placa ya existe', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'existing', plate: 'XYZ123' });
      await expect(
        service.create({
          plate: 'xyz123',
          brand: 'Toyota',
          model: 'Hilux',
          year: 2022,
          mileage: 40000,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('busca por placa cuando no es un UUID', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'v1', plate: 'AAA111' });
      const result = await service.findOne('AAA111');
      expect(result.plate).toBe('AAA111');
      expect(mockRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { plate: 'AAA111' } }),
      );
    });

    it('busca por ID cuando es un UUID válido', async () => {
      const uuid = '11111111-1111-1111-1111-111111111111';
      mockRepo.findOne.mockResolvedValue({ id: uuid, plate: 'AAA111' });
      const result = await service.findOne(uuid);
      expect(result.id).toBe(uuid);
      expect(mockRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: uuid } }),
      );
    });

    it('lanza NotFoundException cuando el vehículo no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('NOEXISTE')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMaintenances', () => {
    it('retorna el historial de mantenimientos del vehículo', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'v1', plate: 'AAA111' });
      mockMaintenanceRepo.find.mockResolvedValue([{ id: 'm1', vehicleId: 'v1' }]);

      const result = await service.findMaintenances('AAA111');
      expect(result).toHaveLength(1);
      expect(mockMaintenanceRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { vehicleId: 'v1' } }),
      );
    });
  });

  describe('remove', () => {
    it('inactiva el vehículo y aplica softDelete', async () => {
      const vehicle = { id: 'v1', status: VehicleStatus.AVAILABLE };
      mockRepo.findOne.mockResolvedValue(vehicle);

      const result = await service.remove('v1');
      expect(vehicle.status).toBe(VehicleStatus.INACTIVE);
      expect(mockRepo.softDelete).toHaveBeenCalledWith('v1');
      expect(result.deleted).toBe(true);
    });
  });
});
