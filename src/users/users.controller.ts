import { Body, Controller, Get, Post, UseGuards, Param, ParseIntPipe, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto } from 'src/dto/users.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) {}

    @Get('getAll')
    @ApiOperation({ 
        summary: 'Lấy danh sách tất cả người dùng', 
        description: 'Lấy danh sách tất cả người dùng trong hệ thống (chỉ dành cho admin)' 
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Danh sách tất cả người dùng được trả về thành công',
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
    @Post('update/:id')
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Cập nhật thông tin người dùng', 
        description: 'Cập nhật thông tin của một người dùng theo ID (yêu cầu xác thực)' 
    })
    @ApiResponse({ status: 200, description: 'Thông tin người dùng được cập nhật thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
    @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() user: UpdateUserDto): Promise<User> {
        return this.usersService.update(id, user);
    }
}
