import { IntegrationData } from '../../integration-data/entities/integration-data.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

import { Score } from '../../score/entities/score.entity';
import { Organization } from 'src/modules/organizations/entities/organization.entity';
import { Credit } from 'src/modules/credit/entities/credit.entity';
// import { Credential } from '../../auth/entities/credential.entity';
// import { Account } from '../../finance/entities/account.entity';
// import { UserRole } from './user-role.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
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

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
  
  @ManyToOne(() => Organization, (organization) => organization.users, { onDelete: 'CASCADE' })
  organization: Organization;


  // Un usuario puede tener muchos créditos
  @OneToMany(() => Credit, (credit) => credit.user)
  credits: Credit[];

  // Un usuario puede tener muchos scores
  @OneToMany(() => Score, (score) => score.user)
  scores: Score[];

  // Un usuario puede tener muchos IntegrationData (datos de integraciones externas)
  @OneToMany(() => IntegrationData, (integrationData) => integrationData.user)
  integrationData: IntegrationData[];
}
