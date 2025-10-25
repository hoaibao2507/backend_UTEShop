import { Body, Controller, Get, Post, Put, UseGuards, Param, ParseIntPipe, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiConsumes, ApiProperty } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(
        private usersService: UsersService,
        private cloudinaryService: CloudinaryService
    ) {}

    @Get('getAll')
    @ApiOperation({ 
        summary: 'Lấy danh sách khách hàng', 
        description: 'Lấy danh sách tất cả khách hàng (customer) trong hệ thống (chỉ dành cho admin)' 
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Danh sách khách hàng được trả về thành công',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'number', example: 1 },
                    firstName: { type: 'string', example: 'Nguyễn' },
                    lastName: { type: 'string', example: 'Văn A' },
                    email: { type: 'string', example: 'nguyenvana@gmail.com' },
                    phone: { type: 'string', example: '0123456789' },
                    address: { type: 'string', example: '123 Đường ABC' },
                    city: { type: 'string', example: 'TP.HCM' },
                    gender: { type: 'string', example: 'male' },
                    dateOfBirth: { type: 'string', example: '1990-01-01' },
                    isVerified: { type: 'boolean', example: true },
                    createdAt: { type: 'string', example: '2025-08-30T10:00:00Z' },
                    updatedAt: { type: 'string', example: '2025-08-30T10:00:00Z' }
                }
            }
        }
    })
    async getAll(): Promise<User[]> {
        return this.usersService.findAll();
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Lấy thông tin profile của user đang đăng nhập',
        description: 'API này yêu cầu JWT token hợp lệ. Token phải được gửi trong header Authorization: Bearer <token>'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Thông tin profile user',
        schema: {
            type: 'object',
            example: {
                id: 1,
                firstName: "Nguyễn",
                lastName: "Văn A",
                email: "nguyenvana@gmail.com",
                phone: "0123456789",
                address: "123 Đường ABC, Quận 1",
                city: "TP.HCM",
                gender: "male",
                dateOfBirth: "1990-01-01",
                isVerified: true,
                avatar: "/uploads/avatar_abc123.jpg",
                createdAt: "2025-08-30T10:00:00.000Z",
                updatedAt: "2025-08-30T10:00:00.000Z"
            },
            properties: {
                id: { type: 'number', example: 1, description: 'ID của user' },
                firstName: { type: 'string', example: 'Nguyễn', description: 'Tên' },
                lastName: { type: 'string', example: 'Văn A', description: 'Họ' },
                email: { type: 'string', example: 'nguyenvana@gmail.com', description: 'Email' },
                phone: { type: 'string', example: '0123456789', description: 'Số điện thoại' },
                address: { type: 'string', example: '123 Đường ABC', description: 'Địa chỉ' },
                city: { type: 'string', example: 'TP.HCM', description: 'Thành phố' },
                gender: { type: 'string', example: 'male', description: 'Giới tính' },
                dateOfBirth: { type: 'string', example: '1990-01-01', description: 'Ngày sinh' },
                isVerified: { type: 'boolean', example: true, description: 'Trạng thái xác thực' },
                avatar: { type: 'string', example: '/uploads/avatar_abc123.jpg', description: 'Đường dẫn ảnh avatar' },
                createdAt: { type: 'string', example: '2025-08-30T10:00:00Z', description: 'Ngày tạo' },
                updatedAt: { type: 'string', example: '2025-08-30T10:00:00Z', description: 'Ngày cập nhật' }
            }
        }
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Unauthorized - Token không hợp lệ hoặc hết hạn',
        schema: {
            type: 'object',
            example: {
                statusCode: 401,
                message: "Unauthorized"
            }
        }
    })
    @ApiResponse({ 
        status: 500, 
        description: 'Internal Server Error - Lỗi server',
        schema: {
            type: 'object',
            example: {
                statusCode: 500,
                message: "Lỗi lấy profile: Không thể lấy User ID từ token"
            }
        }
    })
    async getProfile(@Request() req): Promise<User> {
        try {
            console.log('🔍 Request user object:', req.user); // Debug log
            console.log('🔍 Request headers:', req.headers); // Debug log
            
            const userId = req.user.id; // Lấy ID từ JWT token
            console.log('🔍 User ID from token:', userId); // Debug log
            
            if (!userId) {
                throw new Error('Không thể lấy User ID từ token');
            }
            
            const user = await this.usersService.findById(userId);
            console.log('✅ User found:', user); // Debug log
            
            return user;
        } catch (error) {
            console.error('❌ Profile error:', error);
            throw new Error(`Lỗi lấy profile: ${error.message}`);
        }
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('create')
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Tạo người dùng mới', 
        description: 'Tạo một người dùng mới trong hệ thống (chỉ dành cho admin) (yêu cầu xác thực)' 
    })
    @ApiResponse({ status: 201, description: 'Người dùng được tạo thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
    async create(@Body() user: CreateUserDto): Promise<User> {
        return this.usersService.create(user);
    }


    @UseGuards(AuthGuard('jwt'))
    @Put('update-profile')
    @ApiBearerAuth()
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ 
        summary: 'Cập nhật profile user (thông tin + avatar)', 
        description: 'Cập nhật thông tin và avatar của user đang đăng nhập trong một request duy nhất' 
    })
    @ApiProperty({
        name: 'firstName',
        description: 'Tên của người dùng',
        required: false,
        type: 'string',
        example: 'Nguyễn'
    })
    @ApiProperty({
        name: 'lastName',
        description: 'Họ của người dùng',
        required: false,
        type: 'string',
        example: 'Văn A'
    })
    @ApiProperty({
        name: 'email',
        description: 'Email của người dùng',
        required: false,
        type: 'string',
        example: 'user@example.com'
    })
    @ApiProperty({
        name: 'phone',
        description: 'Số điện thoại',
        required: false,
        type: 'string',
        example: '0123456789'
    })
    @ApiProperty({
        name: 'address',
        description: 'Địa chỉ chi tiết',
        required: false,
        type: 'string',
        example: '123 Đường ABC, Quận 1'
    })
    @ApiProperty({
        name: 'city',
        description: 'Thành phố',
        required: false,
        type: 'string',
        example: 'TP. Hồ Chí Minh'
    })
    @ApiProperty({
        name: 'ward',
        description: 'Phường/Xã',
        required: false,
        type: 'string',
        example: 'Phường Bến Nghé'
    })
    @ApiProperty({
        name: 'dateOfBirth',
        description: 'Ngày sinh (YYYY-MM-DD)',
        required: false,
        type: 'string',
        example: '1990-01-01'
    })
    @ApiProperty({
        name: 'gender',
        description: 'Giới tính (male, female, other)',
        required: false,
        type: 'string',
        enum: ['male', 'female', 'other'],
        example: 'male'
    })
    @ApiProperty({
        name: 'avatar',
        description: 'File ảnh avatar',
        required: false,
        type: 'string',
        format: 'binary'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Profile được cập nhật thành công',
        schema: {
            type: 'object',
            example: {
                message: 'Profile updated successfully',
                user: {
                    id: 1,
                    firstName: 'Nguyễn',
                    lastName: 'Văn A',
                    email: 'nguyenvana@gmail.com',
                    phone: '0123456789',
                    address: '123 Đường ABC',
                    city: 'TP.HCM',
                    gender: 'male',
                    dateOfBirth: '1990-01-01',
                    avatar: '/uploads/avatar_1234567890.jpg'
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    @UseInterceptors(FileInterceptor('avatar', {
        storage: memoryStorage(), // Lưu trong memory thay vì disk
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
                return cb(new BadRequestException('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif)'), false);
            }
            cb(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
        }
    }))
    async updateProfile(
        @Request() req, 
        @Body() updateUserDto: UpdateUserDto,
        @UploadedFile() avatar?: Express.Multer.File
    ) {
        try {
            const userId = req.user.id;

            // Upload avatar to Cloudinary if provided
            if (avatar) {
                const avatarUrl = await this.cloudinaryService.uploadImageFromBuffer(avatar.buffer, 'avatars');
                updateUserDto.avatar = avatarUrl;
            }

            const updatedUser = await this.usersService.updateProfile(userId, updateUserDto);
            
            return {
                message: 'Profile updated successfully',
                user: updatedUser
            };
        } catch (error) {
            throw new BadRequestException(`Lỗi cập nhật profile: ${error.message}`);
        }
    }

}
