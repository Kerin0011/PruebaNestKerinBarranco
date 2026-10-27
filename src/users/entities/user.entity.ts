import { Exclude } from 'class-transformer';
import { Column, Entity, OneToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/base.entity.js';
import { Role } from '../../common/enums/role.enum.js';
import type { Mechanic } from '../../mechanics/entities/mechanic.entity.js';

@Entity('users')
export class User extends AppBaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Exclude()
  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.TECHNICIAN })
  role: Role;

  @OneToOne('Mechanic', 'user', { nullable: true })
  mechanic?: Relation<Mechanic>;
}
