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
import { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import { QueryWorkshopDto } from './dto/query-workshop.dto.js';
import { UpdateWorkshopDto } from './dto/update-workshop.dto.js';
import { WorkshopsService } from './workshops.service.js';

@ApiTags('workshops')
@ApiBearerAuth()
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar un nuevo taller (Admin)' })
  @Post()
  create(@Body() dto: CreateWorkshopDto) {
    return this.workshopsService.create(dto);
  }

  @Auth()
  @ApiOperation({ summary: 'Listar talleres activos' })
  @Get('active')
  findActive() {
    return this.workshopsService.findActive();
  }

  @Auth()
  @ApiOperation({ summary: 'Listar todos los talleres con paginación y filtros' })
  @Get()
  findAll(@Query() query: QueryWorkshopDto) {
    return this.workshopsService.findAll(query);
  }

  @Auth()
  @ApiOperation({ summary: 'Consultar información de un taller por ID' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workshopsService.findOne(id);
  }

  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar información de un taller (Admin)' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkshopDto,
  ) {
    return this.workshopsService.update(id, dto);
  }

  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Activar o inactivar un taller (Admin)' })
  @Patch(':id/toggle-status')
  toggleStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.workshopsService.toggleStatus(id);
  }
}
