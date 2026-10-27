import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { MaintenanceStatus } from '../../common/enums/maintenance-status.enum.js';

export class UpdateStatusDto {
  @ApiProperty({
    enum: MaintenanceStatus,
    example: MaintenanceStatus.IN_PROGRESS,
    description: 'Nuevo estado del mantenimiento (IN_PROGRESS, COMPLETED, CANCELLED)',
  })
  @IsEnum(MaintenanceStatus, {
    message: 'El estado debe ser IN_PROGRESS, COMPLETED o CANCELLED',
  })
  @IsNotEmpty()
  status: MaintenanceStatus;

  @ApiPropertyOptional({
    example: 'Reemplazo de pastillas de frenos y purga de líquido',
    description: 'Obligatorio si status es COMPLETED (trabajo realizado)',
  })
  @IsOptional()
  @IsString()
  workDone?: string;

  @ApiPropertyOptional({
    example: 'Reemplazo de pastillas de frenos y purga de líquido',
    description: 'Alias alternativo para workDone / descripción de la intervención',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 450.5,
    description: 'Costo final del mantenimiento. Obligatorio si status es COMPLETED',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'El costo final debe ser un número positivo' })
  finalCost?: number;

  @ApiPropertyOptional({
    example: 450.5,
    description: 'Alias alternativo para finalCost',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'El costo debe ser un número positivo' })
  cost?: number;

  @ApiPropertyOptional({
    example: '2026-11-01T12:00:00Z',
    description: 'Fecha de finalización (ISO 8601). Obligatorio si status es COMPLETED',
  })
  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @ApiPropertyOptional({
    example: 45010,
    description: 'Kilometraje final al completar. Obligatorio si status es COMPLETED',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  finalMileage?: number;

  @ApiPropertyOptional({
    example: 45010,
    description: 'Alias alternativo para finalMileage',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage?: number;
}
