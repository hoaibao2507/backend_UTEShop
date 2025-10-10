import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRoleAndStaffFields1760085032243 implements MigrationInterface {
    name = 'AddUserRoleAndStaffFields1760085032243'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\` ON \`vouchers\``);
        await queryRunner.query(`ALTER TABLE \`vouchers\` ADD UNIQUE INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\` (\`code\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`vouchers\` DROP INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\` ON \`vouchers\` (\`code\`)`);
    }

}
