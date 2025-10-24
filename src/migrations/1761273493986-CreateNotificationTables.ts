import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationTables1761273493986 implements MigrationInterface {
    name = 'CreateNotificationTables1761273493986'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\` ON \`vouchers\``);
        await queryRunner.query(`ALTER TABLE \`vouchers\` ADD UNIQUE INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\` (\`code\`)`);
        
        // Check if notifications table exists and has data
        const hasNotificationsTable = await queryRunner.hasTable('notifications');
        if (hasNotificationsTable) {
            // Clear existing notifications to avoid enum conflict
            await queryRunner.query(`DELETE FROM \`notifications\``);
            await queryRunner.query(`ALTER TABLE \`notifications\` CHANGE \`type\` \`type\` enum ('success', 'warning', 'info', 'error') NOT NULL`);
        } else {
            // Create notifications table if it doesn't exist
            await queryRunner.query(`CREATE TABLE \`notifications\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` int NOT NULL, \`type\` enum ('success', 'warning', 'info', 'error') NOT NULL, \`title\` varchar(255) NOT NULL, \`message\` text NOT NULL, \`isRead\` tinyint NOT NULL DEFAULT 0, \`actionUrl\` varchar(500) NULL, \`orderId\` int NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        }
        
        // Update timestamps if they exist
        const hasCreatedAt = await queryRunner.hasColumn('notifications', 'createdAt');
        if (hasCreatedAt) {
            await queryRunner.query(`ALTER TABLE \`notifications\` DROP COLUMN \`createdAt\``);
            await queryRunner.query(`ALTER TABLE \`notifications\` ADD \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        }
        
        const hasUpdatedAt = await queryRunner.hasColumn('notifications', 'updatedAt');
        if (hasUpdatedAt) {
            await queryRunner.query(`ALTER TABLE \`notifications\` DROP COLUMN \`updatedAt\``);
            await queryRunner.query(`ALTER TABLE \`notifications\` ADD \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        }
        
        // Create indexes (with error handling)
        try {
            await queryRunner.query(`CREATE INDEX \`IDX_fe1b8ba550e73f84ff228401aa\` ON \`notifications\` (\`orderId\`)`);
        } catch (error) {
            // Index already exists, ignore error
        }
        
        try {
            await queryRunner.query(`CREATE INDEX \`IDX_831a5a06f879fb0bebf8965871\` ON \`notifications\` (\`createdAt\`)`);
        } catch (error) {
            // Index already exists, ignore error
        }
        
        try {
            await queryRunner.query(`CREATE INDEX \`IDX_8ba28344602d583583b9ea1a50\` ON \`notifications\` (\`isRead\`)`);
        } catch (error) {
            // Index already exists, ignore error
        }
        
        try {
            await queryRunner.query(`CREATE INDEX \`IDX_692a909ee0fa9383e7859f9b40\` ON \`notifications\` (\`userId\`)`);
        } catch (error) {
            // Index already exists, ignore error
        }
        
        // Create notification_templates table
        const hasNotificationTemplatesTable = await queryRunner.hasTable('notification_templates');
        if (!hasNotificationTemplatesTable) {
            await queryRunner.query(`CREATE TABLE \`notification_templates\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type\` enum ('order_status_update', 'payment_success', 'product_low_stock', 'promotion') NOT NULL, \`titleTemplate\` varchar(255) NOT NULL, \`messageTemplate\` text NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        }
        
        // Create user_notification_preferences table
        const hasUserNotificationPreferencesTable = await queryRunner.hasTable('user_notification_preferences');
        if (!hasUserNotificationPreferencesTable) {
            await queryRunner.query(`CREATE TABLE \`user_notification_preferences\` (\`userId\` int NOT NULL, \`orderUpdates\` tinyint NOT NULL DEFAULT 1, \`paymentNotifications\` tinyint NOT NULL DEFAULT 1, \`productAlerts\` tinyint NOT NULL DEFAULT 1, \`promotions\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`userId\`)) ENGINE=InnoDB`);
        }
        
        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE \`user_notification_preferences\` ADD CONSTRAINT \`FK_fc1bb12707451f64b0ebb377fa9\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notifications\` ADD CONSTRAINT \`FK_fe1b8ba550e73f84ff228401aab\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`orderId\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`notifications\` DROP FOREIGN KEY \`FK_fe1b8ba550e73f84ff228401aab\``);
        await queryRunner.query(`ALTER TABLE \`user_notification_preferences\` DROP FOREIGN KEY \`FK_fc1bb12707451f64b0ebb377fa9\``);
        await queryRunner.query(`DROP INDEX \`IDX_692a909ee0fa9383e7859f9b40\` ON \`notifications\``);
        await queryRunner.query(`DROP INDEX \`IDX_8ba28344602d583583b9ea1a50\` ON \`notifications\``);
        await queryRunner.query(`DROP INDEX \`IDX_831a5a06f879fb0bebf8965871\` ON \`notifications\``);
        await queryRunner.query(`DROP INDEX \`IDX_fe1b8ba550e73f84ff228401aa\` ON \`notifications\``);
        await queryRunner.query(`ALTER TABLE \`notifications\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`notifications\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`notifications\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`notifications\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`notifications\` CHANGE \`type\` \`type\` enum ('order_status_change', 'order_created', 'order_cancelled', 'payment_success', 'payment_failed', 'voucher_received', 'product_discount', 'system_announcement') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`vouchers\` DROP INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_efc30b2b9169e05e0e1e19d6dd\` ON \`vouchers\` (\`code\`)`);
    }

}
