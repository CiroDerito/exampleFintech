import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('tienda_nube')
export class TiendaNube {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  storeId: string;

  // Lado inverso: SIN JoinColumn (el FK está en users)
  @OneToOne(() => User, (user) => user.tiendaNube)
  user?: User;

  // Mejor usar jsonb en Postgres
  @Column({ type: 'jsonb' })
  data: any;

  @Column({ type: 'jsonb', nullable: true })
  rawData?: any;
}
