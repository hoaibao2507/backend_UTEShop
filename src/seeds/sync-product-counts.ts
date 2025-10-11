import { DataSource } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';

export async function syncProductCounts(dataSource: DataSource) {
    console.log('🔄 Bắt đầu đồng bộ productCount...');
    
    const categoryRepository = dataSource.getRepository(Category);
    const productRepository = dataSource.getRepository(Product);
    
    try {
        // Lấy tất cả categories
        const categories = await categoryRepository.find();
        
        for (const category of categories) {
            // Đếm số sản phẩm cho từng category
            const productCount = await productRepository
                .createQueryBuilder('product')
                .where('product.categoryId = :categoryId', { categoryId: category.categoryId })
                .getCount();
            
            // Cập nhật productCount trong database
            await categoryRepository
                .createQueryBuilder()
                .update(Category)
                .set({ productCount })
                .where('categoryId = :categoryId', { categoryId: category.categoryId })
                .execute();
            
            console.log(`✅ Category "${category.categoryName}" (ID: ${category.categoryId}): ${productCount} sản phẩm`);
        }
        
        console.log('🎉 Đồng bộ productCount hoàn thành!');
        
    } catch (error) {
        console.error('❌ Lỗi khi đồng bộ productCount:', error);
        throw error;
    }
}

