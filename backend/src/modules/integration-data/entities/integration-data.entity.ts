// Entidad principal para almacenar datos de integraciones externas (Tienda Nube, Meta Ads, etc.)
// Guarda tanto el dato crudo recibido como el procesado para scoring y reportes

import { User } from 'src/modules/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';


export enum IntegrationSource {
  TIENDA_NUBE = 'tienda_nube',
  META_ADS = 'meta_ads',
  GOOGLE_ADS = 'google_ads',
  GOOGLE_ANALYTICS = 'google_analytics',
  INSTAGRAM = 'instagram',
}

@Entity('integration_data')
export class IntegrationData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación N:1 con User. Un usuario puede tener muchos IntegrationData
  @ManyToOne(() => User, (user) => user.integrationData, { onDelete: 'CASCADE' })
  user: User;

  // Fuente de la integración (enum)
  @Column({ type: 'enum', enum: IntegrationSource })
  source: IntegrationSource;

  // Dato crudo recibido de la API externa
  @Column({ type: 'jsonb' })
  raw_data: Record<string, any>;

  // Dato procesado y normalizado para scoring o reportes
  @Column({ type: 'jsonb', nullable: true })
  processed_data?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
