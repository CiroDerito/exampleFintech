// Entidad Score: representa el score crediticio de un usuario
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Credit } from '../../credit/entities/credit.entity';

@Entity('score')
export class Score {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string; // Email del usuario desde BigQuery

  @ManyToOne(() => User, (user) => user.scores, { onDelete: 'SET NULL', nullable: true })
  user?: User; // Relación opcional, se vincula por email

  @Column('decimal')
  value: number;

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, any>; // Desglose de fuentes desde BigQuery

  @OneToMany(() => Credit, (credit) => credit.score)
  credits: Credit[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
