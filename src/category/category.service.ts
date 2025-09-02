import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
    ) {}

    async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
        try {
            const category = this.categoryRepository.create(createCategoryDto);
            return await this.categoryRepository.save(category);
        } catch (error) {
            throw new BadRequestException('Failed to create category');
        }
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ categories: Category[]; total: number; page: number; limit: number }> {
        const [categories, total] = await this.categoryRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return {
            categories,
            total,
            page,
            limit,
        };
    }

    async findOne(id: number): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: { categoryId: id },
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        return category;
    }

    async findProductsByCategory(categoryId: number, page: number = 1, limit: number = 10) {
        const category = await this.findOne(categoryId);
        
        const [products, total] = await this.categoryRepository
            .createQueryBuilder('category')
            .leftJoinAndSelect('category.products', 'product')
            .where('category.categoryId = :categoryId', { categoryId })
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return {
            category,
            products: products[0]?.products || [],
            total,
            page,
            limit,
        };
    }

    async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
        const category = await this.findOne(id);
        
        try {
            Object.assign(category, updateCategoryDto);
            return await this.categoryRepository.save(category);
        } catch (error) {
            throw new BadRequestException('Failed to update category');
        }
    }

    async remove(id: number): Promise<void> {
        const category = await this.findOne(id);
        
        try {
            await this.categoryRepository.remove(category);
        } catch (error) {
            throw new BadRequestException('Cannot delete category with existing products');
        }
    }
}
