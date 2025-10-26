import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddSlugToProduct1732650000000 implements MigrationInterface {
    name = 'AddSlugToProduct1732650000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if slug column already exists
        const table = await queryRunner.getTable('products');
        const hasSlugColumn = table?.findColumnByName('slug');

        if (!hasSlugColumn) {
            // Step 1: Add slug column as nullable first
            await queryRunner.addColumn('products', new TableColumn({
                name: 'slug',
                type: 'varchar',
                length: '255',
                isUnique: false,
                isNullable: true,
            }));
        }

        // Step 2: Generate slug for existing products that don't have slug yet
        const products = await queryRunner.query(`SELECT productId, productName FROM products WHERE slug IS NULL OR slug = ''`);
        
        for (const product of products) {
            const slug = product.productName
                .toLowerCase()
                .trim()
                .replace(/[áàảãạăắằẳẵặâấầẩẫậ]/g, 'a')
                .replace(/[éèẻẽẹêếềểễệ]/g, 'e')
                .replace(/[íìỉĩị]/g, 'i')
                .replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o')
                .replace(/[úùủũụưứừửữự]/g, 'u')
                .replace(/[ýỳỷỹỵ]/g, 'y')
                .replace(/[đ]/g, 'd')
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            
            await queryRunner.query(
                `UPDATE products SET slug = ? WHERE productId = ?`,
                [`${slug}-${product.productId}`, product.productId]
            );
        }

        // Step 3: Add unique constraint if not exists
        const indexExists = await queryRunner.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.statistics 
            WHERE table_schema = DATABASE() 
            AND table_name = 'products' 
            AND index_name = 'unique_slug'
        `);

        if (indexExists[0].count === 0) {
            await queryRunner.query(`ALTER TABLE products ADD UNIQUE KEY unique_slug (slug)`);
        }

        // Step 4: Make column NOT NULL if it's currently nullable
        await queryRunner.query(`ALTER TABLE products MODIFY COLUMN slug varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove slug column from products table
        await queryRunner.dropColumn('products', 'slug');
    }
}

