import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MechanicStatus } from '../common/enums/mechanic-status.enum.js';
import type { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import type { QueryMechanicDto } from './dto/query-mechanic.dto.js';
import type { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { Mechanic } from './entities/mechanic.entity.js';

@Injectable()
export class MechanicsService {
  constructor(
    @InjectRepository(Mechanic)
    private readonly mechanicRepo: Repository<Mechanic>,
  ) {}

  async create(dto: CreateMechanicDto): Promise<Mechanic> {
    const existing = await this.mechanicRepo.findOne({
      where: { email: dto.email.toLowerCase() },
      withDeleted: true,
    });

    if (existing) {
      throw new ConflictException(`Ya existe un mecánico con el correo ${dto.email}`);
    }

    const mechanic = this.mechanicRepo.create({
      ...dto,
      email: dto.email.toLowerCase(),
    });

    return this.mechanicRepo.save(mechanic);
  }

  async findAll({ page, limit, search, status }: QueryMechanicDto) {
    const query = this.mechanicRepo
      .createQueryBuilder('mechanic')
      .leftJoinAndSelect('mechanic.user', 'user');

    if (status) {
      query.andWhere('mechanic.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(mechanic.name ILIKE :search OR mechanic.email ILIKE :search OR mechanic.specialty ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query
      .orderBy('mechanic.createdAt', 'DESC')
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

  async findOne(id: string): Promise<Mechanic> {
    const mechanic = await this.mechanicRepo.findOne({
      where: { id },
      relations: { user: true, maintenances: true },
    });

    if (!mechanic) {
      throw new NotFoundException(`Mecánico con ID ${id} no encontrado`);
    }

    return mechanic;
  }

  async findByUserId(userId: string): Promise<Mechanic | null> {
    return this.mechanicRepo.findOne({
      where: { userId },
      relations: { user: true },
    });
  }

  async update(id: string, dto: UpdateMechanicDto): Promise<Mechanic> {
    const mechanic = await this.findOne(id);

    if (dto.email && dto.email.toLowerCase() !== mechanic.email) {
      const existing = await this.mechanicRepo.findOne({
        where: { email: dto.email.toLowerCase() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`El correo ${dto.email} ya está registrado con otro mecánico`);
      }
      mechanic.email = dto.email.toLowerCase();
    }

    Object.assign(mechanic, {
      ...dto,
      email: dto.email ? dto.email.toLowerCase() : mechanic.email,
    });

    return this.mechanicRepo.save(mechanic);
  }

  async toggleStatus(id: string): Promise<Mechanic> {
    const mechanic = await this.findOne(id);
    mechanic.status =
      mechanic.status === MechanicStatus.ACTIVE
        ? MechanicStatus.INACTIVE
        : MechanicStatus.ACTIVE;
    return this.mechanicRepo.save(mechanic);
  }

  async setStatus(id: string, status: MechanicStatus): Promise<Mechanic> {
    const mechanic = await this.findOne(id);
    mechanic.status = status;
    return this.mechanicRepo.save(mechanic);
  }
}
