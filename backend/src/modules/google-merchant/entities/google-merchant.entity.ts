import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('google_merchant')
export class GoogleMerchant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, (user) => user.googleMerchant)
  @JoinColumn()
  user!: User;

  @Column('jsonb', { nullable: true })
  tokens!: {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
    scope?: string;
    id_token?: string;
    token_type?: string;
  } | null;

  @Column('jsonb', { nullable: true })
  data!: {
    merchantId?: string;
    accountInfo?: any;
    linked_at?: string;
    lastFetched?: string;
    dataQuality?: {
      hasProducts: boolean;
      hasOrders: boolean;
      hasInventory: boolean;
      hasProductStatuses: boolean;
      hasReports: boolean;
    };
    [key: string]: any;
  } | null;

  @Column('jsonb', { nullable: true })
  metrics!: {
    fetched_at: string;
    userId: string;
    merchantId: string;
    startDate: string;
    endDate: string;
    summary?: {
      totalProducts: number;
      totalOrders: number;
      totalInventoryItems: number;
    };
    data?: {
      products?: any[];
      orders?: any[];
      inventory?: any[];
    };
    error?: string;
    timestamp?: string;
    [key: string]: any;
  } | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
