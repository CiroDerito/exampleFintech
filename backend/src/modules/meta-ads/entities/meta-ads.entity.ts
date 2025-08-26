import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('meta_ads')
export class MetaAds {
  @Column({ type: 'jsonb', nullable: true })
  metrics?: any[];
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.metaAds, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'jsonb', nullable: true })
  data?: any;

  @Column({ type: 'jsonb', nullable: true })
  processData?: any;

  @Column({ type: 'varchar', nullable: true })
  accountId?: string;
}
