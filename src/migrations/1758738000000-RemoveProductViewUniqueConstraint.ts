import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveProductViewUniqueConstraint1758738000000 implements MigrationInterface {
    name = 'RemoveProductViewUniqueConstraint1758738000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Xóa unique constraint nếu tồn tại
        try {
            await queryRunner.query(`DROP INDEX \`IDX_9e0cb5aadef22ef931c1560328\` ON \`product_views\``);
        } catch (error) {
            // Ignore error if index doesn't exist
            console.log('Index may not exist, continuing...');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Không cần rollback vì chúng ta không muốn unique constraint
    }
}
