import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from '../entities/wishlist.entity';
import { CreateWishlistDto, WishlistQueryDto } from './dto/wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
  ) {}

  async create(createWishlistDto: CreateWishlistDto): Promise<Wishlist> {
    try {
      // Kiểm tra xem sản phẩm đã có trong wishlist chưa
      const existingWishlist = await this.wishlistRepository.findOne({
        where: {
          userId: createWishlistDto.userId,
          productId: createWishlistDto.productId,
        },
      });

      if (existingWishlist) {
        throw new ConflictException('Product already in wishlist');
      }

      const wishlist = this.wishlistRepository.create(createWishlistDto);
      return await this.wishlistRepository.save(wishlist);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to add product to wishlist');
    }
  }

  async findAll(query: WishlistQueryDto): Promise<{ wishlists: Wishlist[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, userId, productId } = query;

    const queryBuilder = this.wishlistRepository
      .createQueryBuilder('wishlist')
      .leftJoinAndSelect('wishlist.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('wishlist.user', 'user');

    // Apply filters
    if (userId) {
      queryBuilder.andWhere('wishlist.userId = :userId', { userId });
    }

    if (productId) {
      queryBuilder.andWhere('wishlist.productId = :productId', { productId });
    }

    // Apply sorting
    queryBuilder.orderBy('wishlist.createdAt', 'DESC');

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [wishlists, total] = await queryBuilder.getManyAndCount();

    return {
      wishlists,
      total,
      page,
      limit,
    };
  }

  async findByUserId(userId: number, page: number = 1, limit: number = 10): Promise<{ wishlists: Wishlist[]; total: number; page: number; limit: number }> {
    const [wishlists, total] = await this.wishlistRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['product', 'product.category', 'product.images'],
      order: { createdAt: 'DESC' },
    });

    return {
      wishlists,
      total,
      page,
      limit,
    };
  }

  async findByProductId(productId: number, page: number = 1, limit: number = 10): Promise<{ wishlists: Wishlist[]; total: number; page: number; limit: number }> {
    const [wishlists, total] = await this.wishlistRepository.findAndCount({
      where: { productId },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'product'],
      order: { createdAt: 'DESC' },
    });

    return {
      wishlists,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<Wishlist> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { wishlistId: id },
      relations: ['user', 'product', 'product.category', 'product.images'],
    });

    if (!wishlist) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    return wishlist;
  }

  async remove(id: number): Promise<void> {
    const wishlist = await this.findOne(id);
    
    try {
      await this.wishlistRepository.remove(wishlist);
    } catch (error) {
      throw new BadRequestException('Failed to remove product from wishlist');
    }
  }

  async removeByUserAndProduct(userId: number, productId: number): Promise<void> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    if (!wishlist) {
      throw new NotFoundException('Product not found in wishlist');
    }

    try {
      await this.wishlistRepository.remove(wishlist);
    } catch (error) {
      throw new BadRequestException('Failed to remove product from wishlist');
    }
  }

  async isInWishlist(userId: number, productId: number): Promise<boolean> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    return !!wishlist;
  }

  async getWishlistCount(userId: number): Promise<number> {
    return this.wishlistRepository.count({
      where: { userId },
    });
  }

  async getProductWishlistCount(productId: number): Promise<number> {
    return this.wishlistRepository.count({
      where: { productId },
    });
  }

  async getMostWishlistedProducts(limit: number = 10): Promise<{ productId: number; wishlistCount: number; product: any }[]> {
    const result = await this.wishlistRepository
      .createQueryBuilder('wishlist')
      .select('wishlist.productId', 'productId')
      .addSelect('COUNT(*)', 'wishlistCount')
      .leftJoin('wishlist.product', 'product')
      .addSelect('product.productName', 'productName')
      .addSelect('product.price', 'price')
      .addSelect('product.discountPercent', 'discountPercent')
      .groupBy('wishlist.productId')
      .addGroupBy('product.productName')
      .addGroupBy('product.price')
      .addGroupBy('product.discountPercent')
      .orderBy('wishlistCount', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map(item => ({
      productId: parseInt(item.productId),
      wishlistCount: parseInt(item.wishlistCount),
      product: {
        productName: item.productName,
        price: parseFloat(item.price),
        discountPercent: parseFloat(item.discountPercent),
      },
    }));
  }
}
