import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductCountToCategories1760118624015 implements MigrationInterface {
    name = 'AddProductCountToCategories1760118624015'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Kiểm tra xem cột productCount đã tồn tại chưa
        const hasColumn = await queryRunner.hasColumn('categories', 'productCount');
        
        if (!hasColumn) {
            // Thêm cột productCount vào bảng categories
            await queryRunner.query(`ALTER TABLE \`categories\` ADD \`productCount\` int NOT NULL DEFAULT '0'`);
            
            // Cập nhật productCount cho tất cả categories hiện có
            await queryRunner.query(`
                UPDATE \`categories\` c 
                SET \`productCount\` = (
                    SELECT COUNT(*) 
                    FROM \`products\` p 
                    WHERE p.\`categoryId\` = c.\`categoryId\`
                )
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Xóa cột productCount khỏi bảng categories
        await queryRunner.query(`ALTER TABLE \`categories\` DROP COLUMN \`productCount\``);
    }
}