import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator.js';
import { ActiveUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Auth()
  @ApiOperation({ summary: 'Obtener información del usuario autenticado' })
  @Get('me')
  me(@ActiveUser('sub') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todos los usuarios (Admin)' })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Obtener un usuario por ID (Admin)' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }
}
