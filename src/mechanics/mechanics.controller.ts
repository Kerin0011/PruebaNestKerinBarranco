import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { QueryMechanicDto } from './dto/query-mechanic.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { MechanicsService } from './mechanics.service.js';

@ApiTags('mechanics')
@ApiBearerAuth()
@Controller('mechanics')
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar un nuevo mecánico (Admin)' })
  @Post()
  create(@Body() dto: CreateMechanicDto) {
    return this.mechanicsService.create(dto);
  }

  @Auth()
  @ApiOperation({ summary: 'Listar mecánicos con paginación y filtros' })
  @Get()
  findAll(@Query() query: QueryMechanicDto) {
    return this.mechanicsService.findAll(query);
  }

  @Auth()
  @ApiOperation({ summary: 'Consultar información de un mecánico por ID' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mechanicsService.findOne(id);
  }

  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar información de un mecánico (Admin)' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMechanicDto,
  ) {
    return this.mechanicsService.update(id, dto);
  }

  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Activar o inactivar un mecánico (Admin)' })
  @Patch(':id/toggle-status')
  toggleStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.mechanicsService.toggleStatus(id);
  }
}
