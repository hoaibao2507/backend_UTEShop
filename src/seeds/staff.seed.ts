import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/users.entity';
import * as bcrypt from 'bcrypt';

export async function seedStaff(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  // Check if staff already exists
  const existingStaff = await userRepository.findOne({
    where: { email: 'staff@uteshop.com' },
  });

  if (existingStaff) {
    console.log('Staff đã tồn tại, bỏ qua seed');
    return;
  }

  // Create default staff
  const hashedPassword = await bcrypt.hash('staff123', 10);

  const staff = userRepository.create({
    firstName: 'Staff',
    lastName: 'Manager',
    email: 'staff@uteshop.com',
    phone: undefined,
    password: hashedPassword,
    role: UserRole.MANAGER,
    isActive: true,
    isVerified: true,
  });

  await userRepository.save(staff);
  console.log('✅ Đã tạo Staff Manager mặc định:');
  console.log('   Email: staff@uteshop.com');
  console.log('   Password: staff123');
  console.log('   Role: MANAGER');
}
