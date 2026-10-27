import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mechanic } from '../mechanics/entities/mechanic.entity.js';
import { MechanicsModule } from '../mechanics/mechanics.module.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { VehiclesModule } from '../vehicles/vehicles.module.js';
import { Workshop } from '../workshops/entities/workshop.entity.js';
import { WorkshopsModule } from '../workshops/workshops.module.js';
import { Maintenance } from './entities/maintenance.entity.js';
import { MaintenancesController } from './maintenances.controller.js';
import { MaintenancesService } from './maintenances.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Maintenance, Vehicle, Mechanic, Workshop]),
    VehiclesModule,
    MechanicsModule,
    WorkshopsModule,
  ],
  controllers: [MaintenancesController],
  providers: [MaintenancesService],
  exports: [MaintenancesService],
})
export class MaintenancesModule {}
