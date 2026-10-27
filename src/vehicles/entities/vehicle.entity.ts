import { Column, Entity, Index, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/base.entity.js';
import { VehicleStatus } from '../../common/enums/vehicle-status.enum.js';
import type { Maintenance } from '../../maintenances/entities/maintenance.entity.js';

@Entity('vehicles')
export class Vehicle extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ unique: true, length: 15 })
  plate: string;

  @Column({ length: 50 })
  brand: string;

  @Column({ length: 50 })
  model: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  mileage: number;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
  })
  status: VehicleStatus;

  @OneToMany('Maintenance', 'vehicle')
  maintenances: Relation<Maintenance[]>;
}
