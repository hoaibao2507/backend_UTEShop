import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo danh mục mới', description: 'Tạo một danh mục sản phẩm mới trong hệ thống (yêu cầu xác thực)' })
    @ApiResponse({ status: 201, description: 'Danh mục được tạo thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoryService.create(createCategoryDto);
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách danh mục', description: 'Lấy danh sách tất cả danh mục sản phẩm với phân trang' })
    @ApiResponse({ status: 200, description: 'Danh sách danh mục được trả về thành công' })
    async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.categoryService.findAll(page, limit);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy chi tiết danh mục', description: 'Lấy thông tin chi tiết của một danh mục theo ID' })
    @ApiResponse({ status: 200, description: 'Thông tin danh mục được trả về thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục' })
    async findOne(@Param('id') id: string) {
        return this.categoryService.findOne(+id);
    }

    @Get(':id/products')
    @ApiOperation({ summary: 'Lấy sản phẩm theo danh mục', description: 'Lấy danh sách sản phẩm thuộc một danh mục cụ thể với phân trang' })
    @ApiResponse({ status: 200, description: 'Danh sách sản phẩm theo danh mục được trả về thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục' })
    async findProductsByCategory(@Param('id') id: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.categoryService.findProductsByCategory(+id, page, limit);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật danh mục', description: 'Cập nhật thông tin của một danh mục (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Danh mục được cập nhật thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục' })
    async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
        return this.categoryService.update(+id, updateCategoryDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa danh mục', description: 'Xóa một danh mục khỏi hệ thống (yêu cầu xác thực)' })
    @ApiResponse({ status: 200, description: 'Danh mục được xóa thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục' })
    async remove(@Param('id') id: string) {
        return this.categoryService.remove(+id);
    }
}
