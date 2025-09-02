import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from '../entities/product-image.entity';
import { CreateProductImageDto, UpdateProductImageDto } from './dto/product-image.dto';

@Injectable()
export class ProductImageService {
    constructor(
        @InjectRepository(ProductImage)
        private productImageRepository: Repository<ProductImage>,
    ) {}

    async create(createProductImageDto: CreateProductImageDto): Promise<ProductImage> {
        try {
            // If this is set as primary, unset other primary images for this product
            if (createProductImageDto.isPrimary) {
                await this.productImageRepository.update(
                    { productId: createProductImageDto.productId },
                    { isPrimary: false }
                );
            }

            const productImage = this.productImageRepository.create(createProductImageDto);
            return await this.productImageRepository.save(productImage);
        } catch (error) {
            throw new BadRequestException('Failed to create product image');
        }
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ images: ProductImage[]; total: number; page: number; limit: number }> {
        const [images, total] = await this.productImageRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            relations: ['product'],
            order: { imageId: 'DESC' },
        });

        return {
            images,
            total,
            page,
            limit,
        };
    }

    async findOne(id: number): Promise<ProductImage> {
        const image = await this.productImageRepository.findOne({
            where: { imageId: id },
            relations: ['product'],
        });

        if (!image) {
            throw new NotFoundException(`Product image with ID ${id} not found`);
        }

        return image;
    }

    async findByProductId(productId: number): Promise<ProductImage[]> {
        return this.productImageRepository.find({
            where: { productId },
            order: { isPrimary: 'DESC', imageId: 'ASC' },
        });
    }

    async findPrimaryByProductId(productId: number): Promise<ProductImage | null> {
        return this.productImageRepository.findOne({
            where: { productId, isPrimary: true },
        });
    }

    async update(id: number, updateProductImageDto: UpdateProductImageDto): Promise<ProductImage> {
        const image = await this.findOne(id);
        
        try {
            // If this is set as primary, unset other primary images for this product
            if (updateProductImageDto.isPrimary) {
                await this.productImageRepository.update(
                    { productId: image.productId },
                    { isPrimary: false }
                );
            }

            Object.assign(image, updateProductImageDto);
            return await this.productImageRepository.save(image);
        } catch (error) {
            throw new BadRequestException('Failed to update product image');
        }
    }

    async remove(id: number): Promise<void> {
        const image = await this.findOne(id);
        
        try {
            await this.productImageRepository.remove(image);
        } catch (error) {
            throw new BadRequestException('Failed to delete product image');
        }
    }

    async removeByProductId(productId: number): Promise<void> {
        try {
            await this.productImageRepository.delete({ productId });
        } catch (error) {
            throw new BadRequestException('Failed to delete product images');
        }
    }

    async setPrimaryImage(id: number): Promise<ProductImage> {
        const image = await this.findOne(id);
        
        try {
            // Unset all primary images for this product
            await this.productImageRepository.update(
                { productId: image.productId },
                { isPrimary: false }
            );

            // Set this image as primary
            image.isPrimary = true;
            return await this.productImageRepository.save(image);
        } catch (error) {
            throw new BadRequestException('Failed to set primary image');
        }
    }

    async getImageCountByProduct(productId: number): Promise<number> {
        return this.productImageRepository.count({
            where: { productId },
        });
    }
}
