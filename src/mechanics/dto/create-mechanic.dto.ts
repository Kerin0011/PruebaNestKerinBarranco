import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { MechanicStatus } from '../../common/enums/mechanic-status.enum.js';

export class CreateMechanicDto {
  @ApiProperty({ example: 'Carlos Gómez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'carlos.gomez@fleetcore.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: 'Motores Diésel' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  specialty: string;

  @ApiPropertyOptional({ enum: MechanicStatus, default: MechanicStatus.ACTIVE })
  @IsOptional()
  @IsEnum(MechanicStatus)
  status?: MechanicStatus;

  @ApiPropertyOptional({ description: 'ID del usuario asociado (rol TECHNICIAN)' })
  @IsOptional()
  @IsUUID('4', { message: 'userId debe ser un UUID válido' })
  userId?: string;
}
