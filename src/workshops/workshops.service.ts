import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkshopStatus } from '../common/enums/workshop-status.enum.js';
import type { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import type { QueryWorkshopDto } from './dto/query-workshop.dto.js';
import type { UpdateWorkshopDto } from './dto/update-workshop.dto.js';
import { Workshop } from './entities/workshop.entity.js';

@Injectable()
export class WorkshopsService {
  constructor(
    @InjectRepository(Workshop)
    private readonly workshopRepo: Repository<Workshop>,
  ) {}

  async create(dto: CreateWorkshopDto): Promise<Workshop> {
    const workshop = this.workshopRepo.create(dto);
    return this.workshopRepo.save(workshop);
  }

  async findAll({ page, limit, search, status }: QueryWorkshopDto) {
    const query = this.workshopRepo.createQueryBuilder('workshop');

    if (status) {
      query.andWhere('workshop.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(workshop.name ILIKE :search OR workshop.address ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query
      .orderBy('workshop.createdAt', 'DESC')
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

  async findActive(): Promise<Workshop[]> {
    return this.workshopRepo.find({
      where: { status: WorkshopStatus.ACTIVE },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Workshop> {
    const workshop = await this.workshopRepo.findOne({
      where: { id },
      relations: { maintenances: true },
    });

    if (!workshop) {
      throw new NotFoundException(`Taller con ID ${id} no encontrado`);
    }

    return workshop;
  }

  async update(id: string, dto: UpdateWorkshopDto): Promise<Workshop> {
    const workshop = await this.findOne(id);
    Object.assign(workshop, dto);
    return this.workshopRepo.save(workshop);
  }

  async toggleStatus(id: string): Promise<Workshop> {
    const workshop = await this.findOne(id);
    workshop.status =
      workshop.status === WorkshopStatus.ACTIVE
        ? WorkshopStatus.INACTIVE
        : WorkshopStatus.ACTIVE;
    return this.workshopRepo.save(workshop);
  }

  async setStatus(id: string, status: WorkshopStatus): Promise<Workshop> {
    const workshop = await this.findOne(id);
    workshop.status = status;
    return this.workshopRepo.save(workshop);
  }
}
