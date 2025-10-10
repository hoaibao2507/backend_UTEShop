import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/users.entity';
import * as bcrypt from 'bcrypt';

export async function seedCustomer(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  // Check if customer already exists
  const existingCustomer = await userRepository.findOne({
    where: { email: 'customer@uteshop.com' },
  });

  if (existingCustomer) {
    console.log('Customer đã tồn tại, bỏ qua seed');
    return;
  }

  // Create default customer
  const hashedPassword = await bcrypt.hash('customer123', 10);

  const customer = userRepository.create({
    firstName: 'Customer',
    lastName: 'Test',
    email: 'customer@uteshop.com',
    phone: undefined,
    password: hashedPassword,
    role: UserRole.CUSTOMER,
    isActive: true,
    isVerified: true,
  });

  await userRepository.save(customer);
  console.log('✅ Đã tạo Customer mặc định:');
  console.log('   Email: customer@uteshop.com');
  console.log('   Password: customer123');
  console.log('   Role: CUSTOMER');
}
