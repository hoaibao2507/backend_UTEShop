import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixDuplicatePaymentMethods1756823000000 implements MigrationInterface {
  name = 'FixDuplicatePaymentMethods1756823000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Delete duplicate or empty payment methods
    await queryRunner.query(`
      DELETE FROM payment_methods 
      WHERE name = '' OR name IS NULL OR name = 'undefined'
    `);

    // Delete all existing payment methods to start fresh
    await queryRunner.query(`DELETE FROM payment_methods`);

    // Insert default payment methods
    await queryRunner.query(`
      INSERT INTO payment_methods (name, displayName, description, isActive, sortOrder) VALUES
      ('COD', 'Thanh toán khi nhận hàng', 'Thanh toán bằng tiền mặt khi nhận hàng', true, 1),
      ('VNPAY', 'VNPay', 'Thanh toán qua VNPay', true, 2),
      ('MOMO', 'MoMo', 'Thanh toán qua ví MoMo', true, 3),
      ('ZALOPAY', 'ZaloPay', 'Thanh toán qua ZaloPay', true, 4)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete all payment methods
    await queryRunner.query(`DELETE FROM payment_methods`);
  }
}

