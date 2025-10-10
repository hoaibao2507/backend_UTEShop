import { DataSource } from 'typeorm';
import { seedAdmin } from './admin.seed';
import { seedStaff } from './staff.seed';
import { seedCustomer } from './customer.seed';
import { seedVendor } from './vendor.seed';

export async function runSeeds(dataSource: DataSource): Promise<void> {
  try {
    console.log('🌱 Bắt đầu chạy seeds...');
    
    // Run admin seed
    await seedAdmin(dataSource);
    
    // Run staff seed
    await seedStaff(dataSource);
    
    // Run customer seed
    await seedCustomer(dataSource);
    
    // Run vendor seed
    await seedVendor(dataSource);
    
    console.log('✅ Hoàn thành tất cả seeds!');
  } catch (error) {
    console.error('❌ Lỗi khi chạy seeds:', error);
    throw error;
  }
}
