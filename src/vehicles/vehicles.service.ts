import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { VehicleStatus } from '../common/enums/vehicle-status.enum.js';
import type { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import type { QueryVehicleDto } from './dto/query-vehicle.dto.js';
import type { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { Maintenance } from '../maintenances/entities/maintenance.entity.js';
import { Vehicle } from './entities/vehicle.entity.js';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Maintenance)
    private readonly maintenanceRepo: Repository<Maintenance>,
  ) {}

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    const existing = await this.vehicleRepo.findOne({
      where: { plate: dto.plate.toUpperCase() },
      withDeleted: true,
    });

    if (existing) {
      throw new ConflictException(`Ya existe un vehículo registrado con la placa ${dto.plate}`);
    }

    const vehicle = this.vehicleRepo.create({
      ...dto,
      plate: dto.plate.toUpperCase(),
    });

    return this.vehicleRepo.save(vehicle);
  }

  async findAll({ page, limit, search, status }: QueryVehicleDto) {
    const query = this.vehicleRepo.createQueryBuilder('vehicle');

    if (status) {
      query.andWhere('vehicle.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(vehicle.plate ILIKE :search OR vehicle.brand ILIKE :search OR vehicle.model ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query
      .orderBy('vehicle.createdAt', 'DESC')
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

  async findOne(idOrPlate: string): Promise<Vehicle> {
    const isUuid =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        idOrPlate,
      );

    const vehicle = await this.vehicleRepo.findOne({
      where: isUuid ? { id: idOrPlate } : { plate: idOrPlate.toUpperCase() },
      relations: { maintenances: true },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehículo '${idOrPlate}' no encontrado`);
    }

    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (dto.plate && dto.plate.toUpperCase() !== vehicle.plate) {
      const existing = await this.vehicleRepo.findOne({
        where: { plate: dto.plate.toUpperCase() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`La placa ${dto.plate} ya pertenece a otro vehículo`);
      }
      vehicle.plate = dto.plate.toUpperCase();
    }

    Object.assign(vehicle, {
      ...dto,
      plate: dto.plate ? dto.plate.toUpperCase() : vehicle.plate,
    });

    return this.vehicleRepo.save(vehicle);
  }

  async setStatus(id: string, status: VehicleStatus): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    vehicle.status = status;
    return this.vehicleRepo.save(vehicle);
  }

  async findMaintenances(idOrPlate: string) {
    const vehicle = await this.findOne(idOrPlate);
    return this.maintenanceRepo.find({
      where: { vehicleId: vehicle.id },
      relations: { mechanic: true, workshop: true },
      order: { scheduledDate: 'DESC' },
    });
  }

  async remove(id: string) {
    const vehicle = await this.findOne(id);
    vehicle.status = VehicleStatus.INACTIVE;
    await this.vehicleRepo.save(vehicle);
    await this.vehicleRepo.softDelete(id);
    return { id, deleted: true, status: VehicleStatus.INACTIVE };
  }
}
