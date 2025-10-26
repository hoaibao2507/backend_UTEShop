import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin, AdminRole } from '../entities/admin.entity';
import { User, UserRole } from '../users/users.entity';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { Voucher } from '../entities/voucher.entity';
import { Order } from '../entities/order.entity';
import { ProductView } from '../entities/product-view.entity';
import { Wishlist } from '../entities/wishlist.entity';
import { ProductReview } from '../entities/product-review.entity';
import { AdminUpdateDto, AdminChangePasswordDto } from './dto/admin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Voucher)
    private voucherRepository: Repository<Voucher>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(ProductView)
    private productViewRepository: Repository<ProductView>,
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
    @InjectRepository(ProductReview)
    private productReviewRepository: Repository<ProductReview>,
  ) {}


  async findOne(id: number): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { adminId: id },
      select: ['adminId', 'fullName', 'email', 'username', 'role', 'isActive', 'avatar', 'description', 'lastLoginAt', 'createdAt', 'updatedAt'],
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    return admin;
  }

  async findByUsername(username: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { username },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with username ${username} not found`);
    }

    return admin;
  }

  async findByEmail(email: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { email },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with email ${email} not found`);
    }

    return admin;
  }

  async findByRefreshToken(refreshToken: string): Promise<Admin | null> {
    return await this.adminRepository.findOne({
      where: { refreshToken },
    });
  }

  async update(id: number, adminUpdateDto: AdminUpdateDto): Promise<Admin> {
    const admin = await this.findOne(id);

    // Check if email already exists (if changing email)
    if (adminUpdateDto.email && adminUpdateDto.email !== admin.email) {
      const existingAdminByEmail = await this.adminRepository.findOne({ 
        where: { email: adminUpdateDto.email } 
      });
      if (existingAdminByEmail) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    // Check if username already exists (if changing username)
    if (adminUpdateDto.username && adminUpdateDto.username !== admin.username) {
      const existingAdminByUsername = await this.adminRepository.findOne({ 
        where: { username: adminUpdateDto.username } 
      });
      if (existingAdminByUsername) {
        throw new ConflictException('Tên đăng nhập đã được sử dụng');
      }
    }

    // Hash password if provided
    if (adminUpdateDto.password) {
      adminUpdateDto.password = await bcrypt.hash(adminUpdateDto.password, 10);
    }

    try {
      Object.assign(admin, adminUpdateDto);
      return await this.adminRepository.save(admin);
    } catch (error) {
      throw new BadRequestException('Failed to update admin');
    }
  }

  async changePassword(id: number, changePasswordDto: AdminChangePasswordDto): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { adminId: id },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, admin.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    admin.password = hashedNewPassword;

    return await this.adminRepository.save(admin);
  }


  async validateAdmin(username: string, password: string): Promise<Admin | null> {
    const admin = await this.adminRepository.findOne({
      where: { username },
    });

    if (!admin) {
      return null;
    }

    if (!admin.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return null;
    }

    return admin;
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.adminRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async updateRefreshToken(id: number, refreshToken: string | undefined): Promise<void> {
    await this.adminRepository.update(id, {
      refreshToken,
    });
  }

  // Customer management methods
  async getCustomers(query: any): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.CUSTOMER });

    if (query.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    return queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  async getCustomerStatistics(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    inactiveCustomers: number;
    verifiedCustomers: number;
    unverifiedCustomers: number;
  }> {
    const [totalCustomers, activeCustomers, inactiveCustomers, verifiedCustomers, unverifiedCustomers] = await Promise.all([
      this.userRepository.count({ where: { role: UserRole.CUSTOMER } }),
      this.userRepository.count({ where: { role: UserRole.CUSTOMER, isActive: true } }),
      this.userRepository.count({ where: { role: UserRole.CUSTOMER, isActive: false } }),
      this.userRepository.count({ where: { role: UserRole.CUSTOMER, isVerified: true } }),
      this.userRepository.count({ where: { role: UserRole.CUSTOMER, isVerified: false } }),
    ]);

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      verifiedCustomers,
      unverifiedCustomers,
    };
  }

  async getCustomer(id: number): Promise<User> {
    const customer = await this.userRepository.findOne({
      where: { 
        id,
        role: UserRole.CUSTOMER
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async toggleCustomerActive(id: number): Promise<User> {
    const customer = await this.getCustomer(id);
    
    customer.isActive = !customer.isActive;
    return await this.userRepository.save(customer);
  }

  async getStatistics(): Promise<{
    totalUsers: number;
    totalOrders: number;
    totalCategories: number;
    totalVouchers: number;
    totalProducts: number;
    totalViews: number;
    totalWishlists: number;
    totalReviews: number;
  }> {
    const [
      totalUsers,
      totalOrders,
      totalCategories,
      totalVouchers,
      totalProducts,
      totalViews,
      totalWishlists,
      totalReviews
    ] = await Promise.all([
      this.userRepository.count(),
      this.orderRepository.count(),
      this.categoryRepository.count(),
      this.voucherRepository.count(),
      this.productRepository.count(),
      this.productViewRepository.count(),
      this.wishlistRepository.count(),
      this.productReviewRepository.count(),
    ]);

    return {
      totalUsers,
      totalOrders,
      totalCategories,
      totalVouchers,
      totalProducts,
      totalViews,
      totalWishlists,
      totalReviews,
    };
  }

}
