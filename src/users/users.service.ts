import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from './users.entity';
import { Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {}

    async findAll(): Promise<User[]> {
        return await this.usersRepository.find({
            where: { role: UserRole.CUSTOMER }
        });
    }

    async create(userData: CreateUserDto): Promise<User> {
        // Kiểm tra các trường bắt buộc
        if (!userData.email || !userData.firstName || !userData.lastName || !userData.password) {
            throw new Error('Email, firstName, lastName và password là bắt buộc');
        }
        
        const newUser = this.usersRepository.create(userData);
        return await this.usersRepository.save(newUser);
    }

    async update(id: number, userData: UpdateUserDto): Promise<User> {
        const existingUser = await this.usersRepository.findOne({ where: { id } });
        if (!existingUser) {
            throw new Error('User không tồn tại');
        }

        // Cập nhật các trường được cung cấp
        Object.assign(existingUser, userData);
        return await this.usersRepository.save(existingUser);
    }

    async findById(id: number): Promise<User> {
        const user = await this.usersRepository.findOne({ 
            where: { id },
            select: ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'gender', 'dateOfBirth', 'isVerified', 'avatar', 'createdAt', 'updatedAt'] // Không có password, otp, refreshToken
        });
        
        if (!user) {
            throw new Error('User không tồn tại');
        }
        
        return user;
    }

    async updateAvatar(id: number, avatarPath: string): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error('User không tồn tại');
        }

        user.avatar = avatarPath;
        return await this.usersRepository.save(user);
    }

    async updateProfile(id: number, updateData: UpdateUserDto): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error('User không tồn tại');
        }

        // Cập nhật thông tin cơ bản
        Object.assign(user, updateData);

        const updatedUser = await this.usersRepository.save(user);
        
        // Trả về user data (không bao gồm password, otp, refreshToken)
        const { password, otpCode, otpExpiry, refreshToken, ...userProfile } = updatedUser;
        return userProfile as User;
    }

    async verifyOtp(email: string, otp: string): Promise<{ message: string; user?: User }> {
        const user = await this.usersRepository.findOne({ where: { email } });

        if (!user) {
            return { message: 'Email không tồn tại' };
        }

        if (user.isVerified) {
            return { message: 'Tài khoản đã được xác thực' };
        }

        if (user.otpCode !== otp) {
            return { message: 'Mã OTP không đúng' };
        }

        if (Date.now() > user.otpExpiry) {
            return { message: 'Mã OTP đã hết hạn' };
        }

        // Xác thực thành công
        user.isVerified = true;
        user.otpCode = "";
        user.otpExpiry = 0;
        await this.usersRepository.save(user);

        // Trả về user data (không bao gồm password, otp, refreshToken)
        const { password, otpCode, otpExpiry, refreshToken, ...userData } = user;
        return { message: 'Xác thực thành công', user: userData as User };
    }
}
