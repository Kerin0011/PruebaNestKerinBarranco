import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { MaintenanceStatus } from '../common/enums/maintenance-status.enum.js';
import { MaintenanceType } from '../common/enums/maintenance-type.enum.js';
import { MechanicStatus } from '../common/enums/mechanic-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { VehicleStatus } from '../common/enums/vehicle-status.enum.js';
import { WorkshopStatus } from '../common/enums/workshop-status.enum.js';
import type { Env } from '../config/env.schema.js';
import { Maintenance } from '../maintenances/entities/maintenance.entity.js';
import { Mechanic } from '../mechanics/entities/mechanic.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { Workshop } from '../workshops/entities/workshop.entity.js';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Mechanic)
    private readonly mechanicRepo: Repository<Mechanic>,
    @InjectRepository(Workshop)
    private readonly workshopRepo: Repository<Workshop>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Maintenance)
    private readonly maintenanceRepo: Repository<Maintenance>,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async onApplicationBootstrap() {
    await this.runSeed();
  }

  async runSeed() {
    this.logger.log('--- Iniciando Seed de datos iniciales FleetCore ---');

    // 1. Usuarios: 1 ADMIN y 2 TECHNICIAN
    const adminEmail = this.config.get('ADMIN_EMAIL', { infer: true }) || 'admin@fleetcore.com';
    const adminPassword = this.config.get('ADMIN_PASSWORD', { infer: true }) || 'Admin12345!';

    let admin = await this.userRepo.findOne({ where: { email: adminEmail } });
    if (!admin) {
      admin = await this.userRepo.save(
        this.userRepo.create({
          name: 'Administrador FleetCore',
          email: adminEmail,
          password: await hash(adminPassword, 10),
          role: Role.ADMIN,
        }),
      );
      this.logger.log(`Usuario ADMIN creado: ${adminEmail}`);
    }

    let tech1 = await this.userRepo.findOne({ where: { email: 'tech1@fleetcore.com' } });
    if (!tech1) {
      tech1 = await this.userRepo.save(
        this.userRepo.create({
          name: 'Carlos Gómez',
          email: 'tech1@fleetcore.com',
          password: await hash('Tech12345!', 10),
          role: Role.TECHNICIAN,
        }),
      );
      this.logger.log(`Usuario TECHNICIAN 1 creado: tech1@fleetcore.com`);
    }

    let tech2 = await this.userRepo.findOne({ where: { email: 'tech2@fleetcore.com' } });
    if (!tech2) {
      tech2 = await this.userRepo.save(
        this.userRepo.create({
          name: 'Jorge Rivas',
          email: 'tech2@fleetcore.com',
          password: await hash('Tech12345!', 10),
          role: Role.TECHNICIAN,
        }),
      );
      this.logger.log(`Usuario TECHNICIAN 2 creado: tech2@fleetcore.com`);
    }

    // 2. Mecánicos: 2 activos vinculados a los técnicos y 1 inactivo
    let mech1 = await this.mechanicRepo.findOne({ where: { email: 'carlos.gomez@fleetcore.com' } });
    if (!mech1) {
      mech1 = await this.mechanicRepo.save(
        this.mechanicRepo.create({
          name: 'Carlos Gómez',
          email: 'carlos.gomez@fleetcore.com',
          specialty: 'Motores Diésel',
          status: MechanicStatus.ACTIVE,
          userId: tech1.id,
        }),
      );
      this.logger.log('Mecánico 1 (Activo, vinculado a tech1) creado');
    }

    let mech2 = await this.mechanicRepo.findOne({ where: { email: 'jorge.rivas@fleetcore.com' } });
    if (!mech2) {
      mech2 = await this.mechanicRepo.save(
        this.mechanicRepo.create({
          name: 'Jorge Rivas',
          email: 'jorge.rivas@fleetcore.com',
          specialty: 'Frenos y Suspensión',
          status: MechanicStatus.ACTIVE,
          userId: tech2.id,
        }),
      );
      this.logger.log('Mecánico 2 (Activo, vinculado a tech2) creado');
    }

    let mech3 = await this.mechanicRepo.findOne({ where: { email: 'pedro.mendez@fleetcore.com' } });
    if (!mech3) {
      mech3 = await this.mechanicRepo.save(
        this.mechanicRepo.create({
          name: 'Pedro Méndez',
          email: 'pedro.mendez@fleetcore.com',
          specialty: 'Electricidad Automotriz',
          status: MechanicStatus.INACTIVE,
          userId: null,
        }),
      );
      this.logger.log('Mecánico 3 (Inactivo) creado');
    }

    // 3. Talleres: 1 activo y 1 inactivo
    let workshop1 = await this.workshopRepo.findOne({ where: { name: 'Taller Central FleetCore' } });
    if (!workshop1) {
      workshop1 = await this.workshopRepo.save(
        this.workshopRepo.create({
          name: 'Taller Central FleetCore',
          address: 'Av. Principal Industrial #100, Medellín',
          status: WorkshopStatus.ACTIVE,
        }),
      );
      this.logger.log('Taller 1 (Activo) creado: Taller Central FleetCore');
    }

    let workshop2 = await this.workshopRepo.findOne({ where: { name: 'Taller Norte FleetCore' } });
    if (!workshop2) {
      workshop2 = await this.workshopRepo.save(
        this.workshopRepo.create({
          name: 'Taller Norte FleetCore',
          address: 'Calle 45 #12-30, Bello',
          status: WorkshopStatus.INACTIVE,
        }),
      );
      this.logger.log('Taller 2 (Inactivo) creado: Taller Norte FleetCore');
    }

    // 4. Vehículos: 2 AVAILABLE, 1 IN_MAINTENANCE y 1 INACTIVE
    let v1 = await this.vehicleRepo.findOne({ where: { plate: 'AAA111' } });
    if (!v1) {
      v1 = await this.vehicleRepo.save(
        this.vehicleRepo.create({
          plate: 'AAA111',
          brand: 'Toyota',
          model: 'Hilux',
          year: 2022,
          mileage: 45000,
          status: VehicleStatus.AVAILABLE,
        }),
      );
      this.logger.log('Vehículo 1 (AVAILABLE) creado: AAA111');
    }

    let v2 = await this.vehicleRepo.findOne({ where: { plate: 'BBB222' } });
    if (!v2) {
      v2 = await this.vehicleRepo.save(
        this.vehicleRepo.create({
          plate: 'BBB222',
          brand: 'Kenworth',
          model: 'T680',
          year: 2021,
          mileage: 120000,
          status: VehicleStatus.AVAILABLE,
        }),
      );
      this.logger.log('Vehículo 2 (AVAILABLE) creado: BBB222');
    }

    let v3 = await this.vehicleRepo.findOne({ where: { plate: 'CCC333' } });
    if (!v3) {
      v3 = await this.vehicleRepo.save(
        this.vehicleRepo.create({
          plate: 'CCC333',
          brand: 'Chevrolet',
          model: 'FVR',
          year: 2020,
          mileage: 85000,
          status: VehicleStatus.IN_MAINTENANCE,
        }),
      );
      this.logger.log('Vehículo 3 (IN_MAINTENANCE) creado: CCC333');
    }

    let v4 = await this.vehicleRepo.findOne({ where: { plate: 'DDD444' } });
    if (!v4) {
      v4 = await this.vehicleRepo.save(
        this.vehicleRepo.create({
          plate: 'DDD444',
          brand: 'Volvo',
          model: 'FH',
          year: 2018,
          mileage: 250000,
          status: VehicleStatus.INACTIVE,
        }),
      );
      this.logger.log('Vehículo 4 (INACTIVE) creado: DDD444');
    }

    // 5. Mantenimientos: 1 IN_PROGRESS (para v3 CCC333) y 1 COMPLETED (para v1 AAA111)
    const activeMaintenance = await this.maintenanceRepo.findOne({
      where: { vehicleId: v3.id, status: MaintenanceStatus.IN_PROGRESS },
    });
    if (!activeMaintenance) {
      await this.maintenanceRepo.save(
        this.maintenanceRepo.create({
          vehicleId: v3.id,
          mechanicId: mech1.id,
          workshopId: workshop1.id,
          type: MaintenanceType.CORRECTIVE,
          description: 'Reparación del sistema de inyección diésel y calibración de turbo',
          mileage: 85000,
          scheduledDate: new Date(),
          status: MaintenanceStatus.IN_PROGRESS,
        }),
      );
      this.logger.log('Mantenimiento IN_PROGRESS creado para vehículo CCC333');
    }

    const completedMaintenance = await this.maintenanceRepo.findOne({
      where: { vehicleId: v1.id, status: MaintenanceStatus.COMPLETED },
    });
    if (!completedMaintenance) {
      await this.maintenanceRepo.save(
        this.maintenanceRepo.create({
          vehicleId: v1.id,
          mechanicId: mech2.id,
          workshopId: workshop1.id,
          type: MaintenanceType.PREVENTIVE,
          description: 'Mantenimiento preventivo general de 45.000 km',
          mileage: 44500,
          scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          status: MaintenanceStatus.COMPLETED,
          workDone: 'Cambio de aceite sintético, sustitución de filtros de combustible y aire, rotación de neumáticos',
          finalCost: 380.0,
          completedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          finalMileage: 45000,
        }),
      );
      this.logger.log('Mantenimiento COMPLETED creado para vehículo AAA111 (Historial)');
    }

    this.logger.log('--- Seed finalizado exitosamente ---');
  }
}
