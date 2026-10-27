import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { QueryVehicleDto } from './dto/query-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehiclesService } from './vehicles.service.js';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar un nuevo vehículo en la flota (Admin)' })
  @Post()
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Auth()
  @ApiOperation({ summary: 'Listar vehículos con paginación y filtros' })
  @Get()
  findAll(@Query() query: QueryVehicleDto) {
    return this.vehiclesService.findAll(query);
  }

  @Auth()
  @ApiOperation({
    summary: 'Consultar el historial de mantenimientos de un vehículo por ID (UUID) o placa',
  })
  @Get(':term/maintenances')
  findMaintenances(@Param('term') term: string) {
    return this.vehiclesService.findMaintenances(term);
  }

  @Auth()
  @ApiOperation({ summary: 'Consultar vehículo por ID (UUID) o placa' })
  @Get(':term')
  findOne(@Param('term') term: string) {
    return this.vehiclesService.findOne(term);
  }

  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar información de un vehículo (Admin)' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Inactivar/Eliminar lógicamente un vehículo (Admin)' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}
