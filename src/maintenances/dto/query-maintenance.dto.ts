import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { MaintenanceStatus } from '../../common/enums/maintenance-status.enum.js';
import { MaintenanceType } from '../../common/enums/maintenance-type.enum.js';

export class QueryMaintenanceDto extends PaginationDto {
  @ApiPropertyOptional({ enum: MaintenanceStatus })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @ApiPropertyOptional({ enum: MaintenanceType })
  @IsOptional()
  @IsEnum(MaintenanceType)
  type?: MaintenanceType;

  @ApiPropertyOptional({ description: 'Filtrar por ID de vehículo' })
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID de mecánico' })
  @IsOptional()
  @IsUUID('4')
  mechanicId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID de taller' })
  @IsOptional()
  @IsUUID('4')
  workshopId?: string;
}
