import {
  Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn, JoinColumn, RelationId
} from 'typeorm';
import { Bcra } from '../../bcra/entities/bcra.entity';
import { MetaAds } from '../../meta-ads/entities/meta-ads.entity';
import { Score } from '../../score/entities/score.entity';
import { Organization } from 'src/modules/organizations/entities/organization.entity';
import { Credit } from 'src/modules/credit/entities/credit.entity';
import { TiendaNube } from 'src/modules/tienda-nube/entities/tienda-nube.entity';
import { GaAnalytics } from 'src/modules/google-analytics/entities/google-analytics.entity';
import { GoogleMerchant } from 'src/modules/google-merchant/entities/google-merchant.entity';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {


  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ unique: true, type: 'bigint', nullable: true })
  dni?: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login?: Date;

  @OneToOne(() => Organization, (organization) => organization.user, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  organization: Organization;

  @OneToMany(() => Credit, (credit) => credit.user)
  credits: Credit[];

  @OneToMany(() => Score, (score) => score.user)
  scores: Score[];

  // ⬇ Relación con TiendaNube: 
  @OneToOne(() => TiendaNube, (tn) => tn.user, {
    cascade: true,
    nullable: true,
    onDelete: 'SET NULL', 
  })
  @JoinColumn({ name: 'tienda_nube_id' })
  tiendaNube?: TiendaNube;

  @RelationId((user: User) => user.tiendaNube)
  tiendaNubeId?: string | null;

  @OneToOne(() => MetaAds, (meta) => meta.user, {
    cascade: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'meta_id' })
  metaAds?: MetaAds;

  @OneToOne(() => Bcra, { cascade: true, nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'bcra_id' })
  bcra?: Bcra;

   @OneToOne(() => GaAnalytics, (ga) => ga.user, {
    cascade: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'ga_id' })
  gaAnalytics?: GaAnalytics; 

  @RelationId((user: User) => user.gaAnalytics)
  gaAnalyticsId?: string | null;

  @OneToOne(() => GoogleMerchant, (merchant) => merchant.user, {
    cascade: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'google_merchant_id' })
  googleMerchant?: GoogleMerchant;

  @RelationId((user: User) => user.googleMerchant)
  googleMerchantId?: string | null;
}
