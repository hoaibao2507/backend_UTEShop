import { DataSource } from 'typeorm';
import { Admin, AdminRole } from '../entities/admin.entity';
import * as bcrypt from 'bcrypt';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const adminRepository = dataSource.getRepository(Admin);

  // Check if admin already exists
  const existingAdmin = await adminRepository.findOne({
    where: { username: 'admin' },
  });

  if (existingAdmin) {
    console.log('Admin đã tồn tại, bỏ qua seed');
    return;
  }

  // Create default admin
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = adminRepository.create({
    fullName: 'Super Administrator',
    email: 'admin@uteshop.com',
    username: 'admin',
    password: hashedPassword,
    role: AdminRole.SUPER_ADMIN,
    isActive: true,
    description: 'Tài khoản Super Admin mặc định của hệ thống',
  });

  await adminRepository.save(admin);
  console.log('✅ Đã tạo Super Admin mặc định:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('   Email: admin@uteshop.com');
}







