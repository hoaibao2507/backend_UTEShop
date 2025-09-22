import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWishlistTable1758512505417 implements MigrationInterface {
    name = 'CreateWishlistTable1758512505417'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\` ON \`vouchers\``);
        await queryRunner.query(`CREATE TABLE \`wishlists\` (\`wishlistId\` int NOT NULL AUTO_INCREMENT, \`userId\` int NOT NULL, \`productId\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_5629f2896ea05ee200f7a96af4\` (\`userId\`, \`productId\`), PRIMARY KEY (\`wishlistId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`vouchers\` ADD UNIQUE INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\` (\`code\`)`);
        await queryRunner.query(`ALTER TABLE \`wishlists\` ADD CONSTRAINT \`FK_4f3c30555daa6ab0b70a1db772c\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`wishlists\` ADD CONSTRAINT \`FK_063c6f46d6cbebf35f3a5ec3d4e\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`productId\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`wishlists\` DROP FOREIGN KEY \`FK_063c6f46d6cbebf35f3a5ec3d4e\``);
        await queryRunner.query(`ALTER TABLE \`wishlists\` DROP FOREIGN KEY \`FK_4f3c30555daa6ab0b70a1db772c\``);
        await queryRunner.query(`ALTER TABLE \`vouchers\` DROP INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\``);
        await queryRunner.query(`DROP INDEX \`IDX_5629f2896ea05ee200f7a96af4\` ON \`wishlists\``);
        await queryRunner.query(`DROP TABLE \`wishlists\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\` ON \`vouchers\` (\`code\`)`);
    }

}
