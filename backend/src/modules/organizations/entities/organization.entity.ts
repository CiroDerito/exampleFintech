// src/modules/organizations/entities/organization.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, nullable: true })
  phone?: string;

  @Column({ length: 255, nullable: true })
  address?: string;

  @Column({ length: 255, unique: true, nullable: true })
  slug?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
  
  @DeleteDateColumn()
  deletedAt?: Date;


  @OneToMany(() => User, (user) => user.organization)
  users: User[];
}
