import { Column, Entity, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/base.entity.js';
import { WorkshopStatus } from '../../common/enums/workshop-status.enum.js';
import type { Maintenance } from '../../maintenances/entities/maintenance.entity.js';

@Entity('workshops')
export class Workshop extends AppBaseEntity {
  @Column({ length: 120 })
  name: string;

  @Column({ length: 200 })
  address: string;

  @Column({
    type: 'enum',
    enum: WorkshopStatus,
    default: WorkshopStatus.ACTIVE,
  })
  status: WorkshopStatus;

  @OneToMany('Maintenance', 'workshop')
  maintenances: Relation<Maintenance[]>;
}
