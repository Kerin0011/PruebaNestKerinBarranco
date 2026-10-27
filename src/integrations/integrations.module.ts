import { Module } from '@nestjs/common';
import { MaintenancesModule } from '../maintenances/maintenances.module.js';
import { VehiclesModule } from '../vehicles/vehicles.module.js';
import { IntegrationsController } from './integrations.controller.js';

@Module({
  imports: [VehiclesModule, MaintenancesModule],
  controllers: [IntegrationsController],
})
export class IntegrationsModule {}
