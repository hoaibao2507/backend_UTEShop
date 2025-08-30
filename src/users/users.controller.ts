import { Body, Controller, Get, Post, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto } from 'src/dto/users.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) {}

    @Get('getAll')
    async getAll(): Promise<User[]> {
        return this.usersService.findAll();
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('create')
    async create(@Body() user: CreateUserDto): Promise<User> {
        return this.usersService.create(user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('update/:id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() user: UpdateUserDto): Promise<User> {
        return this.usersService.update(id, user);
    }
}
