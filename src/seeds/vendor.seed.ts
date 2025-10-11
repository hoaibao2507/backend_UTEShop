import { DataSource } from 'typeorm';
import { Vendor, VendorStatus } from '../entities/vendor.entity';
import * as bcrypt from 'bcrypt';

export async function seedVendor(dataSource: DataSource): Promise<void> {
  const vendorRepository = dataSource.getRepository(Vendor);

  // Check if vendor already exists
  const existingVendor = await vendorRepository.findOne({
    where: { email: 'vendor@uteshop.com' },
  });

  if (existingVendor) {
    console.log('Vendor đã tồn tại, bỏ qua seed');
    return;
  }

  // Create default vendor
  const hashedPassword = await bcrypt.hash('vendor123', 10);

  const vendor = vendorRepository.create({
    storeName: 'Cửa hàng điện tử ABC',
    ownerName: 'Nguyễn Văn Vendor',
    email: 'vendor@uteshop.com',
    phone: '0123456789',
    address: '123 Đường ABC, Phường XYZ, Quận 1',
    city: 'TP. Hồ Chí Minh',
    ward: 'Phường Bến Nghé',
    businessLicense: 'GPKD123456',
    taxCode: '0123456789',
    username: 'vendor_abc',
    password: hashedPassword,
    description: 'Chuyên bán điện thoại, laptop và phụ kiện chính hãng',
    status: VendorStatus.ACTIVE, // Tạo sẵn ở trạng thái active để test
    isActive: true,
  });

  await vendorRepository.save(vendor);
  console.log('✅ Đã tạo Vendor mặc định:');
  console.log('   Username: vendor_abc');
  console.log('   Password: vendor123');
  console.log('   Email: vendor@uteshop.com');
  console.log('   Store: Cửa hàng điện tử ABC');
  console.log('   Status: ACTIVE');
}


