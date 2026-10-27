import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maintenance } from '../maintenances/entities/maintenance.entity.js';
import { Mechanic } from '../mechanics/entities/mechanic.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { Workshop } from '../workshops/entities/workshop.entity.js';
import { SeedService } from './seed.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Mechanic, Workshop, Vehicle, Maintenance]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class DatabaseModule {}
