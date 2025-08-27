import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserDto } from 'src/dto/users.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) {}

    @Get('getAll')
    @ApiOperation({ summary: 'Get all users' })
    @ApiResponse({ status: 200, description: 'Return all users', type: [User] })
    async getAll(): Promise<User[]> {
        return this.usersService.findAll();
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('create')
    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({ status: 201, description: 'User created successfully', type: User })
    async create(@Body() user: Partial<UserDto>): Promise<User> {
        return this.usersService.create(user);
    }
}
