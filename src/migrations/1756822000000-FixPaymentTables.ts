import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class FixPaymentTables1756822000000 implements MigrationInterface {
  name = 'FixPaymentTables1756822000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if payment_transactions table exists
    const paymentTransactionsTable = await queryRunner.getTable('payment_transactions');
    
    if (paymentTransactionsTable) {
      // Drop existing foreign key constraints first
      const foreignKeys = paymentTransactionsTable.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('payment_transactions', foreignKey);
      }

      // Drop existing indexes
      const indexes = paymentTransactionsTable.indices;
      for (const index of indexes) {
        await queryRunner.dropIndex('payment_transactions', index);
      }

      // Drop the table
      await queryRunner.dropTable('payment_transactions');
    }

    // Check if payments table exists
    const paymentsTable = await queryRunner.getTable('payments');
    
    if (paymentsTable) {
      // Drop existing foreign key constraints first
      const foreignKeys = paymentsTable.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('payments', foreignKey);
      }

      // Drop existing indexes
      const indexes = paymentsTable.indices;
      for (const index of indexes) {
        await queryRunner.dropIndex('payments', index);
      }

      // Drop the table
      await queryRunner.dropTable('payments');
    }

    // Check if payment_methods table exists
    const paymentMethodsTable = await queryRunner.getTable('payment_methods');
    
    if (paymentMethodsTable) {
      // Drop existing foreign key constraints first
      const foreignKeys = paymentMethodsTable.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('payment_methods', foreignKey);
      }

      // Drop existing indexes
      const indexes = paymentMethodsTable.indices;
      for (const index of indexes) {
        await queryRunner.dropIndex('payment_methods', index);
      }

      // Drop the table
      await queryRunner.dropTable('payment_methods');
    }

    // Recreate payment_methods table
    await queryRunner.createTable(
      new Table({
        name: 'payment_methods',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'displayName',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'config',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'sortOrder',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Recreate payments table
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'orderId',
            type: 'int',
          },
          {
            name: 'paymentMethodId',
            type: 'int',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'VND'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'success', 'failed', 'cancelled', 'refunded'],
            default: "'pending'",
          },
          {
            name: 'transactionId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'expiredAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Recreate payment_transactions table
    await queryRunner.createTable(
      new Table({
        name: 'payment_transactions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'paymentId',
            type: 'int',
          },
          {
            name: 'transactionId',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'gatewayResponse',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'success', 'failed', 'cancelled'],
            default: "'pending'",
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'VND'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key constraints
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedColumnNames: ['orderId'],
        referencedTableName: 'orders',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['paymentMethodId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'payment_methods',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payment_transactions',
      new TableForeignKey({
        columnNames: ['paymentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'payments',
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_orderId',
        columnNames: ['orderId'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'payment_transactions',
      new TableIndex({
        name: 'IDX_payment_transactions_paymentId',
        columnNames: ['paymentId'],
      }),
    );

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
    // Drop tables in reverse order
    await queryRunner.dropTable('payment_transactions');
    await queryRunner.dropTable('payments');
    await queryRunner.dropTable('payment_methods');
  }
}

