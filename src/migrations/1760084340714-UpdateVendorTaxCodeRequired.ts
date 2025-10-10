import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateVendorTaxCodeRequired1760084340714 implements MigrationInterface {
    name = 'UpdateVendorTaxCodeRequired1760084340714'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\` ON \`vouchers\``);
        await queryRunner.query(`ALTER TABLE \`vendors\` DROP COLUMN \`taxCode\``);
        await queryRunner.query(`ALTER TABLE \`vendors\` ADD \`taxCode\` varchar(13) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`vendors\` ADD UNIQUE INDEX \`IDX_135ed29abdbe5064211ecda505\` (\`taxCode\`)`);
        await queryRunner.query(`ALTER TABLE \`vouchers\` ADD UNIQUE INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\` (\`code\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`vouchers\` DROP INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\``);
        await queryRunner.query(`ALTER TABLE \`vendors\` DROP INDEX \`IDX_135ed29abdbe5064211ecda505\``);
        await queryRunner.query(`ALTER TABLE \`vendors\` DROP COLUMN \`taxCode\``);
        await queryRunner.query(`ALTER TABLE \`vendors\` ADD \`taxCode\` varchar(50) NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\` ON \`vouchers\` (\`code\`)`);
    }

}
