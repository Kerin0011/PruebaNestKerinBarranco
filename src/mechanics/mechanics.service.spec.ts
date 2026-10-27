import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MechanicStatus } from '../common/enums/mechanic-status.enum.js';
import { Mechanic } from './entities/mechanic.entity.js';
import { MechanicsService } from './mechanics.service.js';

describe('MechanicsService', () => {
  let service: MechanicsService;

  const mockRepo = {
    findOne: jest.fn(),
    create: jest.fn((data) => ({ id: 'm1', ...data })),
    save: jest.fn((m) => Promise.resolve(m)),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        MechanicsService,
        { provide: getRepositoryToken(Mechanic), useValue: mockRepo },
      ],
    }).compile();

    service = moduleRef.get(MechanicsService);
  });

  describe('create', () => {
    it('crea un nuevo mecánico si el email es único', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const dto = {
        name: 'Andrés Pérez',
        email: 'andres@fleetcore.com',
        specialty: 'Transmisiones',
      };

      const result = await service.create(dto);
      expect(result.email).toBe('andres@fleetcore.com');
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('rechaza el registro si el correo ya existe', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'm1', email: 'andres@fleetcore.com' });
      await expect(
        service.create({
          name: 'Andrés Pérez',
          email: 'andres@fleetcore.com',
          specialty: 'Transmisiones',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('toggleStatus', () => {
    it('cambia el estado de ACTIVE a INACTIVE', async () => {
      const mechanic = { id: 'm1', status: MechanicStatus.ACTIVE };
      mockRepo.findOne.mockResolvedValue(mechanic);

      const result = await service.toggleStatus('m1');
      expect(result.status).toBe(MechanicStatus.INACTIVE);
      expect(mockRepo.save).toHaveBeenCalledWith(mechanic);
    });

    it('cambia el estado de INACTIVE a ACTIVE', async () => {
      const mechanic = { id: 'm1', status: MechanicStatus.INACTIVE };
      mockRepo.findOne.mockResolvedValue(mechanic);

      const result = await service.toggleStatus('m1');
      expect(result.status).toBe(MechanicStatus.ACTIVE);
      expect(mockRepo.save).toHaveBeenCalledWith(mechanic);
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException si no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('id-falso')).rejects.toThrow(NotFoundException);
    });
  });
});
