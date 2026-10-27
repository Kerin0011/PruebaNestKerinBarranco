import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkshopStatus } from '../common/enums/workshop-status.enum.js';
import { Workshop } from './entities/workshop.entity.js';
import { WorkshopsService } from './workshops.service.js';

describe('WorkshopsService', () => {
  let service: WorkshopsService;

  const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((data) => ({ id: 'w1', ...data })),
    save: jest.fn((w) => Promise.resolve(w)),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        WorkshopsService,
        { provide: getRepositoryToken(Workshop), useValue: mockRepo },
      ],
    }).compile();

    service = moduleRef.get(WorkshopsService);
  });

  describe('create', () => {
    it('crea un nuevo taller', async () => {
      const dto = {
        name: 'Taller Oriente',
        address: 'Km 12 Vía Rionegro',
      };

      const result = await service.create(dto);
      expect(result.name).toBe('Taller Oriente');
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('findActive', () => {
    it('lista únicamente los talleres en estado ACTIVE', async () => {
      mockRepo.find.mockResolvedValue([
        { id: 'w1', name: 'Taller 1', status: WorkshopStatus.ACTIVE },
      ]);

      const result = await service.findActive();
      expect(result).toHaveLength(1);
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: WorkshopStatus.ACTIVE } }),
      );
    });
  });

  describe('toggleStatus', () => {
    it('invierte el estado del taller', async () => {
      const workshop = { id: 'w1', status: WorkshopStatus.ACTIVE };
      mockRepo.findOne.mockResolvedValue(workshop);

      const result = await service.toggleStatus('w1');
      expect(result.status).toBe(WorkshopStatus.INACTIVE);
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException si no existe el taller', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('id-inexistente')).rejects.toThrow(NotFoundException);
    });
  });
});
