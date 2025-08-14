import { IntegrationData } from '../../integration-data/entities/integration-data.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

import { Score } from '../../score/entities/score.entity';
import { Organization } from 'src/modules/organizations/entities/organization.entity';
import { Credit } from 'src/modules/credit/entities/credit.entity';
// import { Credential } from '../../auth/entities/credential.entity';
// import { Account } from '../../finance/entities/account.entity';
// import { UserRole } from './user-role.entity';

// Enum que define los roles posibles de usuario en el sistema
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
}

// Entidad User que representa a los usuarios en la base de datos
@Entity('users')
export class User {
  // Identificador único del usuario
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Email único del usuario
  @Column({ unique: true })
  email: string;

  // Contraseña (no se selecciona por defecto)
  @Column({ select: false })
  password: string;

  // Nombre del usuario (opcional)
  @Column({ nullable: true })
  name?: string;

  // Teléfono del usuario (opcional)
  @Column({ nullable: true })
  phone?: string;

  // Indica si el usuario está activo
  @Column({ default: true })
  isActive: boolean;

  // Datos adicionales en formato JSON (opcional)
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Rol del usuario en el sistema
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  // Fecha de creación del usuario
  @CreateDateColumn()
  createdAt: Date;

  // Fecha de última actualización del usuario
  @UpdateDateColumn()
  updatedAt: Date;

  // Fecha de borrado lógico del usuario (opcional)
  @DeleteDateColumn()
  deletedAt?: Date;
  
  // Relación: Un usuario pertenece a una organización
  @ManyToOne(() => Organization, (organization) => organization.users, { onDelete: 'CASCADE' })
  organization: Organization;

  // Relación: Un usuario puede tener muchos créditos
  @OneToMany(() => Credit, (credit) => credit.user)
  credits: Credit[];

  // Relación: Un usuario puede tener muchos scores
  @OneToMany(() => Score, (score) => score.user)
  scores: Score[];

  // Relación: Un usuario puede tener muchos IntegrationData (datos de integraciones externas)
  @OneToMany(() => IntegrationData, (integrationData) => integrationData.user)
  integrationData: IntegrationData[];
}
