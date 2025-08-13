// Entidad Credit: representa un crédito otorgado a un usuario
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Score } from 'src/modules/score/entities/score.entity';


export enum CreditStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('credit')
export class Credit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.credits, { onDelete: 'CASCADE' })
  user: User;

  @Column('decimal')
  amount: number;

  @Column({ type: 'enum', enum: CreditStatus })
  status: CreditStatus;

  @ManyToOne(() => Score, (score) => score.credits, { nullable: true })
  score?: Score;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
