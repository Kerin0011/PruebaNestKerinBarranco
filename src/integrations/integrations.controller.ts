import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator.js';
import { ApiKeyGuard } from '../common/guards/api-key.guard.js';
import { MaintenancesService } from '../maintenances/maintenances.service.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';

@ApiTags('integrations')
@ApiSecurity('x-api-key')
@Public()
@UseGuards(ApiKeyGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly maintenancesService: MaintenancesService,
  ) {}

  @ApiOperation({
    summary:
      'Consultar resumen de estado de flota para sistemas externos (requiere cabecera x-api-key)',
  })
  @Get('fleet-status')
  async getFleetStatus() {
    const { items: vehicles, meta } = await this.vehiclesService.findAll({
      page: 1,
      limit: 100,
    });

    const summary = {
      totalVehicles: meta.total,
      available: vehicles.filter((v) => v.status === 'AVAILABLE').length,
      inMaintenance: vehicles.filter((v) => v.status === 'IN_MAINTENANCE').length,
      inactive: vehicles.filter((v) => v.status === 'INACTIVE').length,
      timestamp: new Date().toISOString(),
    };

    return summary;
  }

  @ApiOperation({
    summary:
      'Consultar mantenimientos activos para ERP externo (requiere cabecera x-api-key)',
  })
  @Get('active-maintenances')
  async getActiveMaintenances() {
    return this.maintenancesService.findActive();
  }
}
