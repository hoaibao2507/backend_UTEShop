import { DataSource } from 'typeorm';
import { syncProductCounts } from './sync-product-counts';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function bootstrap() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'uteshop_db',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connected successfully');
    
    await syncProductCounts(dataSource);
    
    await dataSource.destroy();
    console.log('🔌 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during sync:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

bootstrap();


