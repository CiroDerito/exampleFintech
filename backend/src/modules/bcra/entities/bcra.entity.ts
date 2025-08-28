// entities/bcra.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('bcra')
export class Bcra {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 11, unique: true })
    cuitOrCuil: string;

    @Column({ type: 'jsonb', nullable: true })
    deudas: any;

    @Column({ type: 'jsonb', nullable: true })
    historicas: any;

    @Column({ type: 'jsonb', nullable: true })
    chequesRechazados: any;

    @Column({ type: 'jsonb', nullable: true })
    extra?: any;
    
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
    
    @OneToOne(() => User, (u) => u.bcra)
    user?: User;
}
