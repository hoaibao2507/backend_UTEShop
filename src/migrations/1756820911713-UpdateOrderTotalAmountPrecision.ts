import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateOrderTotalAmountPrecision1756820911713 implements MigrationInterface {
    name = 'UpdateOrderTotalAmountPrecision1756820911713'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`totalAmount\` \`totalAmount\` decimal(15,2) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`totalAmount\` \`totalAmount\` decimal(10,2) NOT NULL`);
    }

}
