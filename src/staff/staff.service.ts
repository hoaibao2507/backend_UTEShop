import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, UserRole } from '../users/users.entity';
import { StaffCreateDto, StaffUpdateDto, StaffChangePasswordDto, StaffQueryDto } from './dto/staff.dto';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(staffCreateDto: StaffCreateDto, avatar?: Express.Multer.File): Promise<User> {
    // Check if email already exists
    const existingUserByEmail = await this.userRepository.findOne({ 
      where: { email: staffCreateDto.email } 
    });
    if (existingUserByEmail) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Check if phone already exists (if provided)
    if (staffCreateDto.phone) {
      const existingUserByPhone = await this.userRepository.findOne({ 
        where: { phone: staffCreateDto.phone } 
      });
      if (existingUserByPhone) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(staffCreateDto.password, 10);

    // Handle avatar upload
    let avatarPath: string | undefined = undefined;
    if (avatar) {
      avatarPath = await this.saveAvatar(avatar);
    }

    // Create staff user
    const userData: any = {
      firstName: staffCreateDto.firstName,
      lastName: staffCreateDto.lastName,
      email: staffCreateDto.email,
      phone: staffCreateDto.phone,
      address: staffCreateDto.address,
      city: staffCreateDto.city,
      gender: staffCreateDto.gender,
      password: hashedPassword,
      role: staffCreateDto.role || UserRole.STAFF,
      isActive: staffCreateDto.isActive !== undefined ? staffCreateDto.isActive : true,
      isVerified: true, // Staff accounts are auto-verified
      avatar: avatarPath,
      dateOfBirth: staffCreateDto.dateOfBirth ? new Date(staffCreateDto.dateOfBirth) : undefined,
    };

    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user) as unknown as User;
  }

  async findAll(query: StaffQueryDto): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .where('user.role IN (:...roles)', { 
        roles: [UserRole.STAFF, UserRole.MANAGER] 
      });

    if (query.role) {
      queryBuilder.andWhere('user.role = :role', { role: query.role });
    }

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

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { 
        id,
        role: In([UserRole.STAFF, UserRole.MANAGER])
      },
    });

    if (!user) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { 
        email,
        role: In([UserRole.STAFF, UserRole.MANAGER])
      },
    });

    if (!user) {
      throw new NotFoundException(`Staff with email ${email} not found`);
    }

    return user;
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { refreshToken },
    });
  }

  async update(id: number, staffUpdateDto: StaffUpdateDto, avatar?: Express.Multer.File): Promise<User> {
    const user = await this.findOne(id);

    // Check if email already exists (if changing email)
    if (staffUpdateDto.email && staffUpdateDto.email !== user.email) {
      const existingUserByEmail = await this.userRepository.findOne({ 
        where: { email: staffUpdateDto.email } 
      });
      if (existingUserByEmail) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    // Check if phone already exists (if changing phone)
    if (staffUpdateDto.phone && staffUpdateDto.phone !== user.phone) {
      const existingUserByPhone = await this.userRepository.findOne({ 
        where: { phone: staffUpdateDto.phone } 
      });
      if (existingUserByPhone) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    // Handle avatar upload
    if (avatar) {
      // Delete old avatar if exists
      if (user.avatar) {
        await this.deleteAvatar(user.avatar);
      }
      user.avatar = await this.saveAvatar(avatar);
    }

    try {
      // Handle dateOfBirth conversion
      const updateData = { ...staffUpdateDto };
      if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth) as any;
      }

      // Handle password if provided
      if (updateData.password) {
        const hashedPassword = await bcrypt.hash(updateData.password, 10);
        user.password = hashedPassword;
        delete updateData.password; // Remove password from updateData to avoid overwriting
      }

      Object.assign(user, updateData);
      return await this.userRepository.save(user);
    } catch (error) {
      throw new BadRequestException('Failed to update staff');
    }
  }

  async changePassword(id: number, changePasswordDto: StaffChangePasswordDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.password = hashedNewPassword;

    return await this.userRepository.save(user);
  }

  async toggleActive(id: number): Promise<User> {
    const user = await this.findOne(id);
    
    user.isActive = !user.isActive;
    return await this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);

    // Delete avatar if exists
    if (user.avatar) {
      await this.deleteAvatar(user.avatar);
    }

    try {
      await this.userRepository.remove(user);
    } catch (error) {
      throw new BadRequestException('Failed to delete staff');
    }
  }

  // File upload methods
  private async saveAvatar(file: Express.Multer.File): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Return relative path for database storage
    return `avatars/${fileName}`;
  }

  private async deleteAvatar(avatarPath: string): Promise<void> {
    if (!avatarPath) return;
    
    const fullPath = path.join(process.cwd(), 'uploads', avatarPath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  async validateStaff(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { 
        email,
        role: In([UserRole.STAFF, UserRole.MANAGER])
      },
    });

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async updateRefreshToken(id: number, refreshToken: string | undefined): Promise<void> {
    await this.userRepository.update(id, {
      refreshToken,
    });
  }

  async getStaffStatistics(): Promise<{
    totalStaff: number;
    activeStaff: number;
    inactiveStaff: number;
    staffCount: number;
    managerCount: number;
  }> {
    const [totalStaff, activeStaff, inactiveStaff, staffCount, managerCount] = await Promise.all([
      this.userRepository.count({ where: { role: UserRole.STAFF } }),
      this.userRepository.count({ where: { role: UserRole.STAFF, isActive: true } }),
      this.userRepository.count({ where: { role: UserRole.STAFF, isActive: false } }),
      this.userRepository.count({ where: { role: UserRole.STAFF } }),
      this.userRepository.count({ where: { role: UserRole.MANAGER } }),
    ]);

    return {
      totalStaff: totalStaff + managerCount,
      activeStaff: activeStaff + await this.userRepository.count({ where: { role: UserRole.MANAGER, isActive: true } }),
      inactiveStaff: inactiveStaff + await this.userRepository.count({ where: { role: UserRole.MANAGER, isActive: false } }),
      staffCount,
      managerCount,
    };
  }
}
