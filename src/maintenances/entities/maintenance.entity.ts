import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/base.entity.js';
import { MaintenanceStatus } from '../../common/enums/maintenance-status.enum.js';
import { MaintenanceType } from '../../common/enums/maintenance-type.enum.js';
import { Mechanic } from '../../mechanics/entities/mechanic.entity.js';
import { Vehicle } from '../../vehicles/entities/vehicle.entity.js';
import { Workshop } from '../../workshops/entities/workshop.entity.js';

@Entity('maintenances')
export class Maintenance extends AppBaseEntity {
  @Column({
    type: 'enum',
    enum: MaintenanceType,
  })
  type: MaintenanceType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  mileage: number;

  @Index()
  @Column({ name: 'scheduled_date', type: 'timestamptz' })
  scheduledDate: Date;

  @Index()
  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.SCHEDULED,
  })
  status: MaintenanceStatus;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @ManyToOne(() => Vehicle, (v) => v.maintenances, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Relation<Vehicle>;

  @Column({ name: 'mechanic_id' })
  mechanicId: string;

  @ManyToOne(() => Mechanic, (m) => m.maintenances, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'mechanic_id' })
  mechanic: Relation<Mechanic>;

  @Column({ name: 'workshop_id' })
  workshopId: string;

  @ManyToOne(() => Workshop, (w) => w.maintenances, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workshop_id' })
  workshop: Relation<Workshop>;

  @Column({ name: 'work_done', type: 'text', nullable: true })
  workDone: string | null;

  @Column({
    name: 'final_cost',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (v: number | null) => v,
      from: (v: string | null) => (v !== null ? Number(v) : null),
    },
  })
  finalCost: number | null;

  @Column({ name: 'completed_date', type: 'timestamptz', nullable: true })
  completedDate: Date | null;

  @Column({ name: 'final_mileage', type: 'int', nullable: true })
  finalMileage: number | null;
}
