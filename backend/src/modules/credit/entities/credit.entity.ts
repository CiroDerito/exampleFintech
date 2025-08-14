import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Score } from 'src/modules/score/entities/score.entity';

// Enum que define los estados posibles de un crédito
export enum CreditStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Entidad Credit: representa un crédito otorgado a un usuario
@Entity('credit')
export class Credit {
  // Identificador único del crédito
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación: El crédito pertenece a un usuario
  @ManyToOne(() => User, (user) => user.credits, { onDelete: 'CASCADE' })
  user: User;

  // Monto solicitado o aprobado del crédito
  @Column('decimal')
  amount: number;

  // Estado actual del crédito
  @Column({ type: 'enum', enum: CreditStatus })
  status: CreditStatus;

  // Relación: Score usado para calcular el crédito (opcional)
  @ManyToOne(() => Score, (score) => score.credits, { nullable: true })
  score?: Score;

  // Fecha de creación del crédito
  @CreateDateColumn()
  createdAt: Date;

  // Fecha de última actualización del crédito
  @UpdateDateColumn()
  updatedAt: Date;
}
