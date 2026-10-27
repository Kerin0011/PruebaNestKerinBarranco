import { PartialType } from '@nestjs/swagger';
import { CreateMechanicDto } from './create-mechanic.dto.js';

export class UpdateMechanicDto extends PartialType(CreateMechanicDto) {}
