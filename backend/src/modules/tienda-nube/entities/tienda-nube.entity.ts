
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('tienda_nube')
export class TiendaNube {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  user?: User;

  @Column('json')
  data: any;

  @Column('json', { nullable: true })
  rawData?: any;
}
