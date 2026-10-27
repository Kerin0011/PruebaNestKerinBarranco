import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { MechanicStatus } from '../../common/enums/mechanic-status.enum.js';

export class QueryMechanicDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Buscar por nombre, correo o especialidad' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: MechanicStatus })
  @IsOptional()
  @IsEnum(MechanicStatus)
  status?: MechanicStatus;
}
