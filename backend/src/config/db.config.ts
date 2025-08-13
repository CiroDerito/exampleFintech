import { TypeOrmModuleOptions } from '@nestjs/typeorm';
export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  //supabase
  url: process.env.DATABASE_URL,
  //local
  // host: process.env.DB_HOST || 'localhost',
  // port:3000,
  // username: process.env.DB_USERNAME || 'postgres',
  // password: process.env.DB_PASSWORD || '',
  // database: process.env.DB_NAME || 'loopilocal',
  autoLoadEntities: true,
  synchronize: process.env.NODE_ENV !== 'production', // Solo true en dev
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  logging: true,
  dropSchema: false,
});

