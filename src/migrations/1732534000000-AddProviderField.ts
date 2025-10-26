import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddProviderField1732534000000 implements MigrationInterface {
    name = 'AddProviderField1732534000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if googleId column exists
        const table = await queryRunner.getTable("user");
        const googleIdColumn = table?.findColumnByName("googleId");
        
        if (!googleIdColumn) {
            await queryRunner.addColumn("user", new TableColumn({
                name: "googleId",
                type: "varchar",
                isNullable: true
            }));
        }

        // Check if provider column exists
        const providerColumn = table?.findColumnByName("provider");
        if (!providerColumn) {
            await queryRunner.addColumn("user", new TableColumn({
                name: "provider",
                type: "varchar",
                isNullable: true
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("user", "provider");
        await queryRunner.dropColumn("user", "googleId");
    }
}
