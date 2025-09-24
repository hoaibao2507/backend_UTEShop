import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto, WishlistQueryDto } from './dto/wishlist.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('wishlist')
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thêm sản phẩm vào danh sách yêu thích', description: 'Thêm một sản phẩm vào danh sách yêu thích của người dùng (yêu cầu xác thực)' })
  @ApiResponse({ status: 201, description: 'Sản phẩm được thêm vào danh sách yêu thích thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 409, description: 'Sản phẩm đã có trong danh sách yêu thích' })
  async create(@Body() createWishlistDto: CreateWishlistDto, @Request() req) {
    // Sử dụng userId từ JWT token thay vì từ body
    const userId = req.user.id;
    return this.wishlistService.create({ ...createWishlistDto, userId });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách yêu thích của người dùng', description: 'Lấy danh sách sản phẩm yêu thích của người dùng hiện tại (yêu cầu xác thực)' })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Số trang (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Số lượng mỗi trang (mặc định: 10)' })
  @ApiResponse({ status: 200, description: 'Danh sách yêu thích được trả về thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async findByUserId(@Query('page') page: number = 1, @Query('limit') limit: number = 10, @Request() req) {
    const userId = req.user.id;
    return this.wishlistService.findByUserId(userId, page, limit);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách yêu thích của người dùng cụ thể', description: 'Lấy danh sách sản phẩm yêu thích của một người dùng cụ thể (yêu cầu xác thực)' })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Số trang (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Số lượng mỗi trang (mặc định: 10)' })
  @ApiResponse({ status: 200, description: 'Danh sách yêu thích được trả về thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async findByUserIdParam(@Param('userId') userId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.wishlistService.findByUserId(+userId, page, limit);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Lấy danh sách người dùng yêu thích sản phẩm', description: 'Lấy danh sách người dùng đã thêm sản phẩm vào danh sách yêu thích' })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Số trang (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Số lượng mỗi trang (mặc định: 10)' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng yêu thích sản phẩm được trả về thành công' })
  async findByProductId(@Param('productId') productId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.wishlistService.findByProductId(+productId, page, limit);
  }

  @Get('product/:productId/count')
  @ApiOperation({ summary: 'Đếm số người dùng yêu thích sản phẩm', description: 'Đếm số lượng người dùng đã thêm sản phẩm vào danh sách yêu thích' })
  @ApiResponse({ status: 200, description: 'Số lượng người dùng yêu thích sản phẩm được trả về thành công' })
  async getProductWishlistCount(@Param('productId') productId: string) {
    const count = await this.wishlistService.getProductWishlistCount(+productId);
    return { productId: +productId, wishlistCount: count };
  }

  @Get('user/:userId/count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đếm số sản phẩm trong danh sách yêu thích', description: 'Đếm số lượng sản phẩm trong danh sách yêu thích của người dùng (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Số lượng sản phẩm trong danh sách yêu thích được trả về thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getUserWishlistCount(@Param('userId') userId: string) {
    const count = await this.wishlistService.getWishlistCount(+userId);
    return { userId: +userId, wishlistCount: count };
  }

  @Get('most-wishlisted')
  @ApiOperation({ summary: 'Lấy sản phẩm được yêu thích nhiều nhất', description: 'Lấy danh sách sản phẩm được nhiều người dùng yêu thích nhất' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Số lượng sản phẩm (mặc định: 10)' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm được yêu thích nhiều nhất được trả về thành công' })
  async getMostWishlistedProducts(@Query('limit') limit: number = 10) {
    return this.wishlistService.getMostWishlistedProducts(limit);
  }

  @Get('check/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra sản phẩm có trong danh sách yêu thích', description: 'Kiểm tra xem sản phẩm có trong danh sách yêu thích của người dùng hiện tại không (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Trạng thái sản phẩm trong danh sách yêu thích được trả về thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async isInWishlist(@Param('productId') productId: string, @Request() req) {
    const userId = req.user.id;
    const isInWishlist = await this.wishlistService.isInWishlist(userId, +productId);
    return { productId: +productId, userId, isInWishlist };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết mục danh sách yêu thích', description: 'Lấy thông tin chi tiết của một mục trong danh sách yêu thích' })
  @ApiResponse({ status: 200, description: 'Thông tin mục danh sách yêu thích được trả về thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy mục danh sách yêu thích' })
  async findOne(@Param('id') id: string) {
    return this.wishlistService.findOne(+id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi danh sách yêu thích', description: 'Xóa một sản phẩm khỏi danh sách yêu thích (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Sản phẩm được xóa khỏi danh sách yêu thích thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy mục danh sách yêu thích' })
  async remove(@Param('id') id: string) {
    await this.wishlistService.remove(+id);
    return { message: 'Product removed from wishlist successfully' };
  }

  @Delete('product/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi danh sách yêu thích của người dùng', description: 'Xóa một sản phẩm khỏi danh sách yêu thích của người dùng hiện tại (yêu cầu xác thực)' })
  @ApiResponse({ status: 200, description: 'Sản phẩm được xóa khỏi danh sách yêu thích thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Sản phẩm không có trong danh sách yêu thích' })
  async removeByProduct(@Param('productId') productId: string, @Request() req) {
    const userId = req.user.id;
    await this.wishlistService.removeByUserAndProduct(userId, +productId);
    return { message: 'Product removed from wishlist successfully' };
  }
}
