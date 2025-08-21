import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, 
         CreateDateColumn, UpdateDateColumn, DeleteDateColumn, JoinColumn, RelationId } from 'typeorm';
import { Score } from '../../score/entities/score.entity';
import { Organization } from 'src/modules/organizations/entities/organization.entity';
import { Credit } from 'src/modules/credit/entities/credit.entity';
import { TiendaNube } from 'src/modules/tienda-nube/entities/tienda-nube.entity';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ unique: true, type: 'bigint', nullable: true })
  dni?: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt?: Date;

  @OneToOne(() => Organization, (organization) => organization.user, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  organization: Organization;

  @OneToMany(() => Credit, (credit) => credit.user)
  credits: Credit[];

  @OneToMany(() => Score, (score) => score.user)
  scores: Score[];

  // ⬇️ Relación con TiendaNube: el FK queda en USERS (users.tienda_nube_id)
  @OneToOne(() => TiendaNube, (tn) => tn.user, {
    cascade: true,
    nullable: true,
    onDelete: 'SET NULL', // al borrar TN, setea null en users.tienda_nube_id
  })
  @JoinColumn({ name: 'tienda_nube_id' }) // OWNERSHIP aquí
  tiendaNube?: TiendaNube;

  // ⬇️ Acceso directo al UUID sin cargar relación
  @RelationId((user: User) => user.tiendaNube)
  tiendaNubeId?: string | null;
}
