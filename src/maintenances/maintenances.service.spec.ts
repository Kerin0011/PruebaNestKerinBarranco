import { jest } from '@jest/globals';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MaintenanceStatus } from '../common/enums/maintenance-status.enum.js';
import { MaintenanceType } from '../common/enums/maintenance-type.enum.js';
import { MechanicStatus } from '../common/enums/mechanic-status.enum.js';
import { VehicleStatus } from '../common/enums/vehicle-status.enum.js';
import { WorkshopStatus } from '../common/enums/workshop-status.enum.js';
import { Mechanic } from '../mechanics/entities/mechanic.entity.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { Workshop } from '../workshops/entities/workshop.entity.js';
import { Maintenance } from './entities/maintenance.entity.js';
import { MaintenancesService } from './maintenances.service.js';

describe('MaintenancesService', () => {
  let service: MaintenancesService;

  const mockMaintenanceRepo = {
    findOne: jest.fn<(...args: any[]) => Promise<any>>(),
    find: jest.fn<(...args: any[]) => Promise<any>>(),
    save: jest.fn<(...args: any[]) => Promise<any>>((m: any) => Promise.resolve(m)),
    create: jest.fn((dto: any) => ({ id: 'm1', ...dto })),
    createQueryBuilder: jest.fn(),
  };

  const mockVehicleRepo = {
    findOne: jest.fn<(...args: any[]) => Promise<any>>(),
    count: jest.fn<(...args: any[]) => Promise<any>>(),
    save: jest.fn<(...args: any[]) => Promise<any>>((v: any) => Promise.resolve(v)),
  };

  const mockMechanicRepo = {
    findOne: jest.fn<(...args: any[]) => Promise<any>>(),
    save: jest.fn<(...args: any[]) => Promise<any>>((m: any) => Promise.resolve(m)),
  };

  const mockWorkshopRepo = {
    findOne: jest.fn<(...args: any[]) => Promise<any>>(),
    save: jest.fn<(...args: any[]) => Promise<any>>((w: any) => Promise.resolve(w)),
  };

  const mockEntityManager = {
    findOne: jest.fn<(...args: any[]) => Promise<any>>(),
    save: jest.fn<(...args: any[]) => Promise<any>>((e: any) => Promise.resolve(e)),
  };

  const mockDataSource = {
    transaction: jest.fn((cb: any) => cb(mockEntityManager)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockMaintenanceRepo.find.mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        MaintenancesService,
        { provide: getRepositoryToken(Maintenance), useValue: mockMaintenanceRepo },
        { provide: getRepositoryToken(Vehicle), useValue: mockVehicleRepo },
        { provide: getRepositoryToken(Mechanic), useValue: mockMechanicRepo },
        { provide: getRepositoryToken(Workshop), useValue: mockWorkshopRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = moduleRef.get(MaintenancesService);
  });

  describe('create', () => {
    const validDto = {
      vehicleId: 'v1',
      mechanicId: 'm1',
      workshopId: 'w1',
      type: MaintenanceType.PREVENTIVE,
      description: 'Mantenimiento preventivo',
      mileage: 50000,
      scheduledDate: '2026-11-01T10:00:00Z',
    };

    it('rechaza la creación si el vehículo no existe', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(null);
      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
    });

    it('rechaza la creación si el mecánico no existe', async () => {
      mockVehicleRepo.findOne.mockResolvedValue({
        id: 'v1',
        status: VehicleStatus.AVAILABLE,
        mileage: 40000,
      });
      mockMaintenanceRepo.findOne.mockResolvedValue(null);
      mockMechanicRepo.findOne.mockResolvedValue(null);

      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
    });

    it('rechaza la creación si el taller no existe', async () => {
      mockVehicleRepo.findOne.mockResolvedValue({
        id: 'v1',
        status: VehicleStatus.AVAILABLE,
        mileage: 40000,
      });
      mockMaintenanceRepo.findOne.mockResolvedValue(null);
      mockMechanicRepo.findOne.mockResolvedValue({
        id: 'm1',
        status: MechanicStatus.ACTIVE,
      });
      mockWorkshopRepo.findOne.mockResolvedValue(null);

      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
    });

    it('rechaza la creación si el vehículo está en estado INACTIVE', async () => {
      mockVehicleRepo.findOne.mockResolvedValue({
        id: 'v1',
        status: VehicleStatus.INACTIVE,
        mileage: 40000,
      });

      await expect(service.create(validDto)).rejects.toThrow(BadRequestException);
    });

    it('rechaza la creación si el vehículo ya tiene un mantenimiento activo', async () => {
      mockVehicleRepo.findOne.mockResolvedValue({
        id: 'v1',
        status: VehicleStatus.AVAILABLE,
        mileage: 40000,
      });
      mockMaintenanceRepo.findOne.mockResolvedValueOnce({
        id: 'existing-active',
        status: MaintenanceStatus.IN_PROGRESS,
      });

      await expect(service.create(validDto)).rejects.toThrow(BadRequestException);
    });

    it('rechaza la creación si el kilometraje es inferior al kilometraje actual del vehículo', async () => {
      mockVehicleRepo.findOne.mockResolvedValue({
        id: 'v1',
        status: VehicleStatus.AVAILABLE,
        mileage: 60000,
      });
      mockMaintenanceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ ...validDto, mileage: 50000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza la creación si el mecánico está inactivo', async () => {
      mockVehicleRepo.findOne.mockResolvedValue({
        id: 'v1',
        status: VehicleStatus.AVAILABLE,
        mileage: 40000,
      });
      mockMaintenanceRepo.findOne.mockResolvedValue(null);
      mockMechanicRepo.findOne.mockResolvedValue({
        id: 'm1',
        status: MechanicStatus.INACTIVE,
      });

      await expect(service.create(validDto)).rejects.toThrow(BadRequestException);
    });

    it('rechaza la creación si el mecánico tiene un mantenimiento con horario cruzado', async () => {
      mockVehicleRepo.findOne.mockResolvedValue({
        id: 'v1',
        status: VehicleStatus.AVAILABLE,
        mileage: 40000,
      });
      mockMaintenanceRepo.findOne.mockResolvedValue(null);
      mockMechanicRepo.findOne.mockResolvedValue({
        id: 'm1',
        status: MechanicStatus.ACTIVE,
      });
      mockMaintenanceRepo.find.mockResolvedValue([
        {
          id: 'prev-m',
          mechanicId: 'm1',
          scheduledDate: new Date('2026-11-01T07:30:00Z'),
          status: MaintenanceStatus.SCHEDULED,
        },
      ]);

      await expect(
        service.create({ ...validDto, scheduledDate: '2026-11-01T08:00:00Z' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('permite la creación si el horario posterior no se cruza', async () => {
      mockVehicleRepo.findOne.mockResolvedValue({
        id: 'v1',
        status: VehicleStatus.AVAILABLE,
        mileage: 40000,
      });
      mockMaintenanceRepo.findOne.mockResolvedValue(null);
      mockMechanicRepo.findOne.mockResolvedValue({
        id: 'm1',
        status: MechanicStatus.ACTIVE,
      });
      mockWorkshopRepo.findOne.mockResolvedValue({
        id: 'w1',
        status: WorkshopStatus.ACTIVE,
      });
      mockMaintenanceRepo.find.mockResolvedValue([
        {
          id: 'prev-m',
          mechanicId: 'm1',
          scheduledDate: new Date('2026-11-01T07:30:00Z'),
          status: MaintenanceStatus.SCHEDULED,
        },
      ]);
      mockMaintenanceRepo.save.mockImplementation((m) => Promise.resolve(m));

      const result = await service.create({
        ...validDto,
        scheduledDate: '2026-11-01T09:00:00Z',
      });
      expect(result.status).toBe(MaintenanceStatus.SCHEDULED);
    });

    it('rechaza la creación si el taller está inactivo', async () => {
      mockVehicleRepo.findOne.mockResolvedValue({
        id: 'v1',
        status: VehicleStatus.AVAILABLE,
        mileage: 40000,
      });
      mockMaintenanceRepo.findOne.mockResolvedValue(null);
      mockMechanicRepo.findOne.mockResolvedValue({
        id: 'm1',
        status: MechanicStatus.ACTIVE,
      });
      mockWorkshopRepo.findOne.mockResolvedValue({
        id: 'w1',
        status: WorkshopStatus.INACTIVE,
      });

      await expect(service.create(validDto)).rejects.toThrow(BadRequestException);
    });

    it('crea exitosamente el mantenimiento con estado inicial SCHEDULED', async () => {
      mockVehicleRepo.findOne.mockResolvedValue({
        id: 'v1',
        status: VehicleStatus.AVAILABLE,
        mileage: 40000,
      });
      mockMaintenanceRepo.findOne.mockResolvedValue(null);
      mockMechanicRepo.findOne.mockResolvedValue({
        id: 'm1',
        status: MechanicStatus.ACTIVE,
      });
      mockWorkshopRepo.findOne.mockResolvedValue({
        id: 'w1',
        status: WorkshopStatus.ACTIVE,
      });
      mockMaintenanceRepo.save.mockImplementation((m) => Promise.resolve(m));

      const result = await service.create(validDto);
      expect(result.status).toBe(MaintenanceStatus.SCHEDULED);
      expect(mockMaintenanceRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateStatus - Reglas de transición de estado', () => {
    it('cambia a IN_PROGRESS y actualiza el vehículo a IN_MAINTENANCE', async () => {
      const maintenance = {
        id: 'm1',
        status: MaintenanceStatus.SCHEDULED,
        vehicleId: 'v1',
        mileage: 50000,
      };
      const vehicle = {
        id: 'v1',
        status: VehicleStatus.AVAILABLE,
        mileage: 50000,
      };

      mockEntityManager.findOne.mockImplementation((entity) => {
        if (entity === Maintenance) return Promise.resolve(maintenance);
        if (entity === Vehicle) return Promise.resolve(vehicle);
        return Promise.resolve(null);
      });
      mockEntityManager.save.mockImplementation((_, data) => Promise.resolve(data));

      const result = await service.updateStatus('m1', {
        status: MaintenanceStatus.IN_PROGRESS,
      });

      expect(result.status).toBe(MaintenanceStatus.IN_PROGRESS);
      expect(vehicle.status).toBe(VehicleStatus.IN_MAINTENANCE);
    });

    it('rechaza completar el mantenimiento si no contiene la información obligatoria de cierre', async () => {
      const maintenance = {
        id: 'm1',
        status: MaintenanceStatus.IN_PROGRESS,
        vehicleId: 'v1',
        mileage: 50000,
      };
      const vehicle = {
        id: 'v1',
        status: VehicleStatus.IN_MAINTENANCE,
        mileage: 50000,
      };

      mockEntityManager.findOne.mockImplementation((entity) => {
        if (entity === Maintenance) return Promise.resolve(maintenance);
        if (entity === Vehicle) return Promise.resolve(vehicle);
        return Promise.resolve(null);
      });

      await expect(
        service.updateStatus('m1', {
          status: MaintenanceStatus.COMPLETED,
          workDone: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('completa el mantenimiento, actualiza el vehículo a AVAILABLE y su kilometraje al finalMileage', async () => {
      const maintenance = {
        id: 'm1',
        status: MaintenanceStatus.IN_PROGRESS,
        vehicleId: 'v1',
        mileage: 50000,
      };
      const vehicle = {
        id: 'v1',
        status: VehicleStatus.IN_MAINTENANCE,
        mileage: 50000,
      };

      mockEntityManager.findOne.mockImplementation((entity) => {
        if (entity === Maintenance) return Promise.resolve(maintenance);
        if (entity === Vehicle) return Promise.resolve(vehicle);
        return Promise.resolve(null);
      });
      mockEntityManager.save.mockImplementation((_, data) => Promise.resolve(data));

      const result = await service.updateStatus('m1', {
        status: MaintenanceStatus.COMPLETED,
        workDone: 'Cambio de pastillas y discos de freno',
        finalCost: 450,
        completedDate: '2026-11-01T14:00:00Z',
        finalMileage: 50020,
      });

      expect(result.status).toBe(MaintenanceStatus.COMPLETED);
      expect(vehicle.status).toBe(VehicleStatus.AVAILABLE);
      expect(vehicle.mileage).toBe(50020);
    });

    it('completa el mantenimiento usando campos alternativos (description, cost, mileage)', async () => {
      const maintenance = {
        id: 'm1',
        status: MaintenanceStatus.IN_PROGRESS,
        vehicleId: 'v1',
        mileage: 50000,
      };
      const vehicle = {
        id: 'v1',
        status: VehicleStatus.IN_MAINTENANCE,
        mileage: 50000,
      };

      mockEntityManager.findOne.mockImplementation((entity) => {
        if (entity === Maintenance) return Promise.resolve(maintenance);
        if (entity === Vehicle) return Promise.resolve(vehicle);
        return Promise.resolve(null);
      });
      mockEntityManager.save.mockImplementation((_, data) => Promise.resolve(data));

      const result = await service.updateStatus('m1', {
        status: MaintenanceStatus.COMPLETED,
        description: 'Reparación de embrague y cambio de aceite',
        cost: 600,
        completedDate: '2026-11-02T10:00:00Z',
        mileage: 50050,
      });

      expect(result.status).toBe(MaintenanceStatus.COMPLETED);
      expect(result.workDone).toBe('Reparación de embrague y cambio de aceite');
      expect(result.finalCost).toBe(600);
      expect(vehicle.status).toBe(VehicleStatus.AVAILABLE);
      expect(vehicle.mileage).toBe(50050);
    });

    it('rechaza modificar un mantenimiento que ya se encuentra en COMPLETED', async () => {
      const maintenance = {
        id: 'm1',
        status: MaintenanceStatus.COMPLETED,
        vehicleId: 'v1',
      };

      mockEntityManager.findOne.mockImplementation((entity) => {
        if (entity === Maintenance) return Promise.resolve(maintenance);
        return Promise.resolve(null);
      });

      await expect(
        service.updateStatus('m1', { status: MaintenanceStatus.IN_PROGRESS }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza modificar un mantenimiento que ya se encuentra en CANCELLED', async () => {
      const maintenance = {
        id: 'm1',
        status: MaintenanceStatus.CANCELLED,
        vehicleId: 'v1',
      };

      mockEntityManager.findOne.mockImplementation((entity) => {
        if (entity === Maintenance) return Promise.resolve(maintenance);
        return Promise.resolve(null);
      });

      await expect(
        service.updateStatus('m1', { status: MaintenanceStatus.IN_PROGRESS }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza completar el mantenimiento si el kilometraje final es inferior al kilometraje registrado al iniciar', async () => {
      const maintenance = {
        id: 'm1',
        status: MaintenanceStatus.IN_PROGRESS,
        vehicleId: 'v1',
        mileage: 50000,
      };
      const vehicle = {
        id: 'v1',
        status: VehicleStatus.IN_MAINTENANCE,
        mileage: 50000,
      };

      mockEntityManager.findOne.mockImplementation((entity) => {
        if (entity === Maintenance) return Promise.resolve(maintenance);
        if (entity === Vehicle) return Promise.resolve(vehicle);
        return Promise.resolve(null);
      });

      await expect(
        service.updateStatus('m1', {
          status: MaintenanceStatus.COMPLETED,
          workDone: 'Mantenimiento general',
          finalCost: 300,
          completedDate: '2026-11-02T10:00:00Z',
          finalMileage: 49900,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('cancela el mantenimiento y libera el vehículo a AVAILABLE si estaba IN_MAINTENANCE', async () => {
      const maintenance = {
        id: 'm1',
        status: MaintenanceStatus.IN_PROGRESS,
        vehicleId: 'v1',
        mileage: 50000,
      };
      const vehicle = {
        id: 'v1',
        status: VehicleStatus.IN_MAINTENANCE,
        mileage: 50000,
      };

      mockEntityManager.findOne.mockImplementation((entity) => {
        if (entity === Maintenance) return Promise.resolve(maintenance);
        if (entity === Vehicle) return Promise.resolve(vehicle);
        return Promise.resolve(null);
      });
      mockEntityManager.save.mockImplementation((_, data) => Promise.resolve(data));

      const result = await service.updateStatus('m1', {
        status: MaintenanceStatus.CANCELLED,
      });

      expect(result.status).toBe(MaintenanceStatus.CANCELLED);
      expect(vehicle.status).toBe(VehicleStatus.AVAILABLE);
    });

    it('rechaza la actualización de estado si un técnico intenta modificar un mantenimiento ajeno', async () => {
      const maintenance = {
        id: 'm1',
        status: MaintenanceStatus.SCHEDULED,
        mechanic: { userId: 'otro-user-id' },
      };

      mockEntityManager.findOne.mockImplementation((entity) => {
        if (entity === Maintenance) return Promise.resolve(maintenance);
        return Promise.resolve(null);
      });

      await expect(
        service.updateStatus(
          'm1',
          { status: MaintenanceStatus.IN_PROGRESS },
          { sub: 'mi-user-id', role: 'TECHNICIAN' as any, email: 'tech@fleetcore.com' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Consultas de mantenimientos', () => {
    it('consulta todos los mantenimientos activos (SCHEDULED o IN_PROGRESS)', async () => {
      mockMaintenanceRepo.find.mockResolvedValue([
        { id: 'm1', status: MaintenanceStatus.SCHEDULED },
        { id: 'm2', status: MaintenanceStatus.IN_PROGRESS },
      ]);

      const result = await service.findActive();
      expect(result).toHaveLength(2);
      expect(mockMaintenanceRepo.find).toHaveBeenCalled();
    });

    it('consulta los mantenimientos asignados a un mecánico específico', async () => {
      mockMaintenanceRepo.find.mockResolvedValue([{ id: 'm1', mechanicId: 'mech-1' }]);

      const result = await service.findByMechanic('mech-1');
      expect(result).toHaveLength(1);
      expect(mockMaintenanceRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { mechanicId: 'mech-1' } }),
      );
    });

    it('busca el historial de mantenimientos por placa de vehículo', async () => {
      mockVehicleRepo.findOne.mockResolvedValue({ id: 'v1', plate: 'AAA111' });
      mockMaintenanceRepo.find.mockResolvedValue([{ id: 'm1', vehicleId: 'v1' }]);

      const result = await service.findByVehicle('AAA111');
      expect(result).toHaveLength(1);
      expect(mockMaintenanceRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { vehicleId: 'v1' } }),
      );
    });

    it('lanza NotFoundException si el vehículo consultado no existe', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(null);
      await expect(service.findByVehicle('NOEXISTE')).rejects.toThrow(NotFoundException);
    });
  });
});
