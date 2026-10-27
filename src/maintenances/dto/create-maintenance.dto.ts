import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { MaintenanceStatus } from '../../common/enums/maintenance-status.enum.js';
import { MaintenanceType } from '../../common/enums/maintenance-type.enum.js';

export class CreateMaintenanceDto {
  @ApiProperty({ description: 'ID del vehículo (UUID)' })
  @IsUUID('4', { message: 'vehicleId debe ser un UUID válido' })
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty({ description: 'ID del mecánico asignado (UUID)' })
  @IsUUID('4', { message: 'mechanicId debe ser un UUID válido' })
  @IsNotEmpty()
  mechanicId: string;

  @ApiProperty({ description: 'ID del taller donde se realizará (UUID)' })
  @IsUUID('4', { message: 'workshopId debe ser un UUID válido' })
  @IsNotEmpty()
  workshopId: string;

  @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.PREVENTIVE })
  @IsEnum(MaintenanceType, { message: 'El tipo debe ser PREVENTIVE o CORRECTIVE' })
  @IsNotEmpty()
  type: MaintenanceType;

  @ApiProperty({ example: 'Mantenimiento preventivo general de 50.000 km' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 45000, description: 'Kilometraje registrado para el mantenimiento' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage: number;

  @ApiProperty({ example: '2026-11-01T08:00:00Z', description: 'Fecha y hora programada (ISO 8601)' })
  @IsDateString({}, { message: 'scheduledDate debe tener un formato ISO válido' })
  @IsNotEmpty()
  scheduledDate: string;

  @ApiPropertyOptional({
    enum: MaintenanceStatus,
    example: MaintenanceStatus.SCHEDULED,
    description: 'Estado inicial del mantenimiento (por defecto SCHEDULED o IN_PROGRESS)',
  })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;
}
