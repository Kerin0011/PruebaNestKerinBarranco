import { Column, Entity, Index, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/base.entity.js';
import { MechanicStatus } from '../../common/enums/mechanic-status.enum.js';
import type { Maintenance } from '../../maintenances/entities/maintenance.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('mechanics')
export class Mechanic extends AppBaseEntity {
  @Column({ length: 100 })
  name: string;

  @Index({ unique: true })
  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ length: 100 })
  specialty: string;

  @Column({
    type: 'enum',
    enum: MechanicStatus,
    default: MechanicStatus.ACTIVE,
  })
  status: MechanicStatus;

  @Column({ name: 'user_id', nullable: true })
  userId?: string | null;

  @OneToOne(() => User, (user) => user.mechanic, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User> | null;

  @OneToMany('Maintenance', 'mechanic')
  maintenances: Relation<Maintenance[]>;
}
