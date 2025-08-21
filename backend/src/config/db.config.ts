import { TypeOrmModuleOptions } from '@nestjs/typeorm';
export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  //supabase
  url: process.env.DATABASE_URL,
  autoLoadEntities: true,
  synchronize: process.env.NODE_ENV !== 'production', // Solo true en dev
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  logging: true,
  dropSchema: false,
});

