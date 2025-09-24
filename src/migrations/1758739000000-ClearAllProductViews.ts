import { MigrationInterface, QueryRunner } from "typeorm";

export class ClearAllProductViews1758739000000 implements MigrationInterface {
    name = 'ClearAllProductViews1758739000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Xóa tất cả dữ liệu trong bảng product_views
        await queryRunner.query(`DELETE FROM \`product_views\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Không thể rollback vì đã xóa dữ liệu
        console.log('Cannot rollback - data has been deleted');
    }
}
