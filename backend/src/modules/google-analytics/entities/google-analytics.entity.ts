import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('ga_analytics')
export class GaAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb', { nullable: true })
  data?: any;

  @Column('jsonb', { nullable: true })
  metrics?: any;

  @ManyToOne(() => User, (u) => u.id, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
