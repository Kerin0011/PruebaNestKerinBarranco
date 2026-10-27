import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface.js';
import { MechanicsService } from '../mechanics/mechanics.service.js';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import { QueryMaintenanceDto } from './dto/query-maintenance.dto.js';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { MaintenancesService } from './maintenances.service.js';

@ApiTags('maintenances')
@ApiBearerAuth()
@Controller('maintenances')
export class MaintenancesController {
  constructor(
    private readonly maintenancesService: MaintenancesService,
    private readonly mechanicsService: MechanicsService,
  ) {}

  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo mantenimiento para un vehículo (Admin)' })
  @Post()
  create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenancesService.create(dto);
  }

  @Auth()
  @ApiOperation({ summary: 'Listar todos los mantenimientos con filtros y paginación' })
  @Get()
  findAll(@Query() query: QueryMaintenanceDto) {
    return this.maintenancesService.findAll(query);
  }

  @Auth()
  @ApiOperation({ summary: 'Consultar mantenimientos activos (SCHEDULED o IN_PROGRESS)' })
  @Get('active')
  findActive() {
    return this.maintenancesService.findActive();
  }

  @Auth(Role.TECHNICIAN, Role.ADMIN)
  @ApiOperation({ summary: 'Consultar mantenimientos asignados al técnico en sesión' })
  @Get('my-assigned')
  async findMyAssigned(@CurrentUser() user: JwtPayload) {
    const mechanic = await this.mechanicsService.findByUserId(user.sub);
    if (!mechanic) {
      return [];
    }
    return this.maintenancesService.findByMechanic(mechanic.id);
  }

  @Auth()
  @ApiOperation({
    summary: 'Consultar historial de mantenimientos de un vehículo específico (por ID o placa)',
  })
  @Get('vehicle/:term')
  findByVehicle(@Param('term') term: string) {
    return this.maintenancesService.findByVehicle(term);
  }

  @Auth()
  @ApiOperation({ summary: 'Consultar mantenimientos asignados a un mecánico específico' })
  @Get('mechanic/:mechanicId')
  findByMechanic(@Param('mechanicId', ParseUUIDPipe) mechanicId: string) {
    return this.maintenancesService.findByMechanic(mechanicId);
  }

  @Auth()
  @ApiOperation({ summary: 'Consultar detalle de un mantenimiento por ID' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.maintenancesService.findOne(id);
  }

  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar datos de un mantenimiento programado (Admin)' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaintenanceDto,
  ) {
    return this.maintenancesService.update(id, dto);
  }

  @Auth(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({
    summary:
      'Actualizar estado de un mantenimiento (IN_PROGRESS, COMPLETED con cierre, o CANCELLED)',
  })
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenancesService.updateStatus(id, dto, user);
  }

  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Cancelar/Eliminar un mantenimiento (Admin)' })
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenancesService.remove(id, user);
  }
}
