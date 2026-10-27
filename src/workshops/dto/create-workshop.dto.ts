import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { WorkshopStatus } from '../../common/enums/workshop-status.enum.js';

export class CreateWorkshopDto {
  @ApiProperty({ example: 'Taller Central FleetCore' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'Av. Industrial 450, Medellín' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;

  @ApiPropertyOptional({ enum: WorkshopStatus, default: WorkshopStatus.ACTIVE })
  @IsOptional()
  @IsEnum(WorkshopStatus)
  status?: WorkshopStatus;
}
