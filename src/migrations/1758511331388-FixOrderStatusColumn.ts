import { MigrationInterface, QueryRunner } from "typeorm";

export class FixOrderStatusColumn1758511331388 implements MigrationInterface {
    name = 'FixOrderStatusColumn1758511331388'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, change the column to VARCHAR temporarily to allow any values
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`status\` \`status\` VARCHAR(50) NOT NULL DEFAULT 'NEW'`);
        
        // Update existing data to match new enum values
        await queryRunner.query(`UPDATE \`orders\` SET \`status\` = 'NEW' WHERE \`status\` = 'pending'`);
        await queryRunner.query(`UPDATE \`orders\` SET \`status\` = 'CONFIRMED' WHERE \`status\` = 'paid'`);
        await queryRunner.query(`UPDATE \`orders\` SET \`status\` = 'SHIPPING' WHERE \`status\` = 'shipped'`);
        await queryRunner.query(`UPDATE \`orders\` SET \`status\` = 'DELIVERED' WHERE \`status\` = 'completed'`);
        await queryRunner.query(`UPDATE \`orders\` SET \`status\` = 'CANCELED' WHERE \`status\` = 'cancelled'`);
        
        // Now change back to enum with new values
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`status\` \`status\` enum ('NEW', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELED', 'CANCEL_REQUEST') NOT NULL DEFAULT 'NEW'`);
        
        // Add other changes
        await queryRunner.query(`ALTER TABLE \`vouchers\` ADD UNIQUE INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\` (\`code\`)`);
        await queryRunner.query(`ALTER TABLE \`order_tracking\` ADD CONSTRAINT \`FK_85acfbdf5c1c33daca863f8118b\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`orderId\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert enum definition first
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`status\` \`status\` enum ('pending', 'paid', 'shipped', 'completed', 'cancelled') NOT NULL DEFAULT 'pending'`);
        
        // Then revert data
        await queryRunner.query(`UPDATE \`orders\` SET \`status\` = 'pending' WHERE \`status\` = 'NEW'`);
        await queryRunner.query(`UPDATE \`orders\` SET \`status\` = 'paid' WHERE \`status\` = 'CONFIRMED'`);
        await queryRunner.query(`UPDATE \`orders\` SET \`status\` = 'shipped' WHERE \`status\` = 'SHIPPING'`);
        await queryRunner.query(`UPDATE \`orders\` SET \`status\` = 'completed' WHERE \`status\` = 'DELIVERED'`);
        await queryRunner.query(`UPDATE \`orders\` SET \`status\` = 'cancelled' WHERE \`status\` = 'CANCELED'`);
        
        // Remove other changes
        await queryRunner.query(`ALTER TABLE \`order_tracking\` DROP FOREIGN KEY \`FK_85acfbdf5c1c33daca863f8118b\``);
        await queryRunner.query(`ALTER TABLE \`vouchers\` DROP INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\``);
    }

}
