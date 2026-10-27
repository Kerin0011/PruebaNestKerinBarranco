import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { MaintenanceStatus } from '../common/enums/maintenance-status.enum.js';
import { MechanicStatus } from '../common/enums/mechanic-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { VehicleStatus } from '../common/enums/vehicle-status.enum.js';
import { WorkshopStatus } from '../common/enums/workshop-status.enum.js';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface.js';
import { Mechanic } from '../mechanics/entities/mechanic.entity.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { Workshop } from '../workshops/entities/workshop.entity.js';
import type { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import type { QueryMaintenanceDto } from './dto/query-maintenance.dto.js';
import type { UpdateMaintenanceDto } from './dto/update-maintenance.dto.js';
import type { UpdateStatusDto } from './dto/update-status.dto.js';
import { Maintenance } from './entities/maintenance.entity.js';

@Injectable()
export class MaintenancesService {
  constructor(
    @InjectRepository(Maintenance)
    private readonly maintenanceRepo: Repository<Maintenance>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Mechanic)
    private readonly mechanicRepo: Repository<Mechanic>,
    @InjectRepository(Workshop)
    private readonly workshopRepo: Repository<Workshop>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateMaintenanceDto): Promise<Maintenance> {
    const vehicle = await this.vehicleRepo.findOne({ where: { id: dto.vehicleId } });
    if (!vehicle) {
      throw new NotFoundException(`El vehículo con ID ${dto.vehicleId} no existe`);
    }

    if (vehicle.status === VehicleStatus.INACTIVE) {
      throw new BadRequestException('Un vehículo en estado INACTIVE no puede ser asociado a un nuevo mantenimiento');
    }

    const activeVehicleMaintenance = await this.maintenanceRepo.findOne({
      where: {
        vehicleId: dto.vehicleId,
        status: In([MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]),
      },
    });

    if (activeVehicleMaintenance) {
      throw new BadRequestException('El vehículo ya tiene un mantenimiento activo (SCHEDULED o IN_PROGRESS)');
    }

    if (dto.mileage < vehicle.mileage) {
      throw new BadRequestException(
        `El kilometraje registrado (${dto.mileage}) no puede ser inferior al kilometraje actual del vehículo (${vehicle.mileage})`,
      );
    }

    const mechanic = await this.mechanicRepo.findOne({ where: { id: dto.mechanicId } });
    if (!mechanic) {
      throw new NotFoundException(`El mecánico con ID ${dto.mechanicId} no existe`);
    }

    if (mechanic.status !== MechanicStatus.ACTIVE) {
      throw new BadRequestException('No se puede asignar un mecánico inactivo');
    }

    const activeMechanicMaintenances = await this.maintenanceRepo.find({
      where: {
        mechanicId: dto.mechanicId,
        status: In([MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]),
      },
    });

    const newStart = new Date(dto.scheduledDate).getTime();
    const durationMs = 90 * 60 * 1000;
    const newEnd = newStart + durationMs;

    const hasScheduleConflict = (activeMechanicMaintenances || []).some((m) => {
      const mStart = new Date(m.scheduledDate).getTime();
      const mEnd = mStart + durationMs;
      return newStart < mEnd && mStart < newEnd;
    });

    if (hasScheduleConflict) {
      throw new BadRequestException(
        'El mecánico ya tiene un mantenimiento activo o programado que se cruza con este horario',
      );
    }

    const workshop = await this.workshopRepo.findOne({ where: { id: dto.workshopId } });
    if (!workshop) {
      throw new NotFoundException(`El taller con ID ${dto.workshopId} no existe`);
    }

    if (workshop.status !== WorkshopStatus.ACTIVE) {
      throw new BadRequestException('No se puede asignar un mantenimiento a un taller inactivo');
    }

    const initialStatus =
      dto.status === MaintenanceStatus.IN_PROGRESS
        ? MaintenanceStatus.IN_PROGRESS
        : MaintenanceStatus.SCHEDULED;

    if (initialStatus === MaintenanceStatus.IN_PROGRESS) {
      vehicle.status = VehicleStatus.IN_MAINTENANCE;
      await this.vehicleRepo.save(vehicle);
    }

    const maintenance = this.maintenanceRepo.create({
      ...dto,
      scheduledDate: new Date(dto.scheduledDate),
      status: initialStatus,
    });

    return this.maintenanceRepo.save(maintenance);
  }

  async findAll({ page, limit, status, type, vehicleId, mechanicId, workshopId }: QueryMaintenanceDto) {
    const query = this.maintenanceRepo
      .createQueryBuilder('maintenance')
      .leftJoinAndSelect('maintenance.vehicle', 'vehicle')
      .leftJoinAndSelect('maintenance.mechanic', 'mechanic')
      .leftJoinAndSelect('maintenance.workshop', 'workshop');

    if (status) query.andWhere('maintenance.status = :status', { status });
    if (type) query.andWhere('maintenance.type = :type', { type });
    if (vehicleId) query.andWhere('maintenance.vehicleId = :vehicleId', { vehicleId });
    if (mechanicId) query.andWhere('maintenance.mechanicId = :mechanicId', { mechanicId });
    if (workshopId) query.andWhere('maintenance.workshopId = :workshopId', { workshopId });

    query
      .orderBy('maintenance.scheduledDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findActive() {
    return this.maintenanceRepo.find({
      where: {
        status: In([MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]),
      },
      relations: { vehicle: true, mechanic: true, workshop: true },
      order: { scheduledDate: 'ASC' },
    });
  }

  async findByVehicle(term: string) {
    const isUuid =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        term,
      );

    const vehicle = await this.vehicleRepo.findOne({
      where: isUuid ? { id: term } : { plate: term.toUpperCase() },
    });

    if (!vehicle) {
      throw new NotFoundException(`El vehículo '${term}' no existe`);
    }

    return this.maintenanceRepo.find({
      where: { vehicleId: vehicle.id },
      relations: { mechanic: true, workshop: true },
      order: { scheduledDate: 'DESC' },
    });
  }

  async findByMechanic(mechanicId: string) {
    return this.maintenanceRepo.find({
      where: { mechanicId },
      relations: { vehicle: true, workshop: true },
      order: { scheduledDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Maintenance> {
    const maintenance = await this.maintenanceRepo.findOne({
      where: { id },
      relations: { vehicle: true, mechanic: true, workshop: true },
    });

    if (!maintenance) {
      throw new NotFoundException(`Mantenimiento con ID ${id} no encontrado`);
    }

    return maintenance;
  }

  async update(id: string, dto: UpdateMaintenanceDto): Promise<Maintenance> {
    const maintenance = await this.findOne(id);

    if (
      maintenance.status === MaintenanceStatus.COMPLETED ||
      maintenance.status === MaintenanceStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `No se puede modificar un mantenimiento en estado ${maintenance.status}`,
      );
    }

    if (dto.vehicleId && dto.vehicleId !== maintenance.vehicleId) {
      const vehicle = await this.vehicleRepo.findOne({ where: { id: dto.vehicleId } });
      if (!vehicle) {
        throw new NotFoundException(`El vehículo con ID ${dto.vehicleId} no existe`);
      }
      if (vehicle.status === VehicleStatus.INACTIVE) {
        throw new BadRequestException(
          'Un vehículo en estado INACTIVE no puede ser asociado a un nuevo mantenimiento',
        );
      }
      maintenance.vehicleId = dto.vehicleId;
    }

    if (dto.mechanicId && dto.mechanicId !== maintenance.mechanicId) {
      const mechanic = await this.mechanicRepo.findOne({ where: { id: dto.mechanicId } });
      if (!mechanic) {
        throw new NotFoundException(`El mecánico con ID ${dto.mechanicId} no existe`);
      }
      if (mechanic.status !== MechanicStatus.ACTIVE) {
        throw new BadRequestException('No se puede asignar un mecánico inactivo');
      }
      maintenance.mechanicId = dto.mechanicId;
    }

    if (dto.workshopId && dto.workshopId !== maintenance.workshopId) {
      const workshop = await this.workshopRepo.findOne({ where: { id: dto.workshopId } });
      if (!workshop) {
        throw new NotFoundException(`El taller con ID ${dto.workshopId} no existe`);
      }
      if (workshop.status !== WorkshopStatus.ACTIVE) {
        throw new BadRequestException('No se puede asignar un mantenimiento a un taller inactivo');
      }
      maintenance.workshopId = dto.workshopId;
    }

    if (dto.type) maintenance.type = dto.type;
    if (dto.description) maintenance.description = dto.description;
    if (dto.mileage !== undefined) maintenance.mileage = dto.mileage;
    if (dto.scheduledDate) maintenance.scheduledDate = new Date(dto.scheduledDate);

    return this.maintenanceRepo.save(maintenance);
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
    currentUser?: JwtPayload,
  ): Promise<Maintenance> {
    // Transacción atómica: sincroniza el estado del mantenimiento y la disponibilidad del vehículo en una sola unidad de trabajo
    return this.dataSource.transaction(async (manager) => {
      const maintenance = await manager.findOne(Maintenance, {
        where: { id },
        relations: { mechanic: true },
      });

      if (!maintenance) {
        throw new NotFoundException(`Mantenimiento con ID ${id} no encontrado`);
      }

      // Validar que un técnico solo modifique sus propios mantenimientos asignados
      if (currentUser && currentUser.role === Role.TECHNICIAN) {
        if (!maintenance.mechanic || maintenance.mechanic.userId !== currentUser.sub) {
          throw new ForbiddenException(
            'Solo el técnico asignado a este mantenimiento puede modificar su estado',
          );
        }
      }

      if (maintenance.status === MaintenanceStatus.COMPLETED) {
        throw new BadRequestException(
          'Un mantenimiento en estado COMPLETED no puede regresar a un estado anterior',
        );
      }

      if (maintenance.status === MaintenanceStatus.CANCELLED) {
        throw new BadRequestException(
          'Un mantenimiento en estado CANCELLED no puede posteriormente cambiar a otro estado',
        );
      }

      const vehicle = await manager.findOne(Vehicle, {
        where: { id: maintenance.vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundException(`Vehículo asociado no encontrado`);
      }

      // Transición IN_PROGRESS: actualiza automáticamente el vehículo a IN_MAINTENANCE
      if (dto.status === MaintenanceStatus.IN_PROGRESS) {
        maintenance.status = MaintenanceStatus.IN_PROGRESS;
        vehicle.status = VehicleStatus.IN_MAINTENANCE;
        await manager.save(Vehicle, vehicle);
      // Transición COMPLETED: registra cierre, actualiza odómetro y libera el vehículo a AVAILABLE
      } else if (dto.status === MaintenanceStatus.COMPLETED) {
        const workDone = dto.workDone ?? dto.description;
        const finalCost = dto.finalCost ?? dto.cost;
        const finalMileage = dto.finalMileage ?? dto.mileage;
        const completedDate = dto.completedDate;

        if (
          !workDone ||
          finalCost === undefined ||
          !completedDate ||
          finalMileage === undefined
        ) {
          throw new BadRequestException(
            'Para completar un mantenimiento es obligatorio registrar: trabajo realizado (workDone o description), costo final (finalCost o cost), fecha de finalización (completedDate) y kilometraje final (finalMileage o mileage)',
          );
        }

        if (finalMileage < maintenance.mileage) {
          throw new BadRequestException(
            `El kilometraje final (${finalMileage}) no puede ser menor al kilometraje registrado al iniciar el mantenimiento (${maintenance.mileage})`,
          );
        }

        maintenance.status = MaintenanceStatus.COMPLETED;
        maintenance.workDone = workDone;
        maintenance.finalCost = finalCost;
        maintenance.completedDate = new Date(completedDate);
        maintenance.finalMileage = finalMileage;

        vehicle.status = VehicleStatus.AVAILABLE;
        vehicle.mileage = finalMileage;
        await manager.save(Vehicle, vehicle);
      } else if (dto.status === MaintenanceStatus.CANCELLED) {
        maintenance.status = MaintenanceStatus.CANCELLED;
        if (vehicle.status === VehicleStatus.IN_MAINTENANCE) {
          vehicle.status = VehicleStatus.AVAILABLE;
          await manager.save(Vehicle, vehicle);
        }
      } else {
        throw new BadRequestException(`Transición a estado '${dto.status}' no permitida`);
      }

      return manager.save(Maintenance, maintenance);
    });
  }

  async remove(id: string, currentUser?: JwtPayload) {
    return this.updateStatus(id, { status: MaintenanceStatus.CANCELLED }, currentUser);
  }
}
