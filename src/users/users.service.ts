import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {}

    async findAll(): Promise<User[]> {
        return await this.usersRepository.find();
    }

    async create(user: Partial<User>): Promise<User> {
        const newUser = this.usersRepository.create(user);
        return await this.usersRepository.save(newUser);
    }

    async findByUsername(username: string): Promise<User | null> {
        return await this.usersRepository.findOne({ where: { username } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.usersRepository.findOne({ where: { email } });
    }

    async verifyOtp(email: string, otp: string): Promise<{ message: string }> {
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

    return { message: 'Xác thực thành công' };
    }

}
