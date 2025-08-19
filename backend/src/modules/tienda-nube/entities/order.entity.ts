import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { forwardRef } from '@nestjs/common';
import { TiendaNube } from './tienda-nube.entity';
import { User } from '../../users/entities/user.entity';

@Entity('order')
export class Order {
	@PrimaryGeneratedColumn('uuid')
	id: string;

		@ManyToOne(() => TiendaNube, { onDelete: 'CASCADE' })
	@JoinColumn()
	tiendaNube: TiendaNube;

		@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn()
	user: User;

	@Column('json')
	data: any;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;
}
