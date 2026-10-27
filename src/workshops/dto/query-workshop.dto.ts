import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { WorkshopStatus } from '../../common/enums/workshop-status.enum.js';

export class QueryWorkshopDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Buscar por nombre o dirección' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: WorkshopStatus })
  @IsOptional()
  @IsEnum(WorkshopStatus)
  status?: WorkshopStatus;
}
