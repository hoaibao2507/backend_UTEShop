// src/data-source.ts
import { DataSource } from 'typeorm';
// Use globbed entities instead of manual imports to avoid missing metadata in seeds

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',     // Thêm fallback 'localhost'
  port: parseInt(process.env.DB_PORT as string) || 3306,  // Thêm fallback 3306
  username: process.env.DB_USER || 'root',      // Thêm fallback 'root'
  password: process.env.DB_PASS || '',         // Thêm fallback ''
  database: process.env.DB_NAME || 'uteshop_db',// Thêm fallback 'uteshop_db'
  
  // Cấu hình entity
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  
  // Cấu hình migration
  migrations: ['src/migrations/**/*.ts'],
  synchronize: true, // Chỉ dùng trong môi trường development
  
  // Các option bổ sung
  logging: true,
  logger: 'file',
  poolSize: 10,
  connectorPackage: 'mysql2',
  extra: {
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  }
});