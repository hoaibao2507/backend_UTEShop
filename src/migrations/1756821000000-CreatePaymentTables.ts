import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class CreatePaymentTables1756821000000 implements MigrationInterface {
  name = 'CreatePaymentTables1756821000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment_methods table
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
            isUnique: true,
          },
          {
            name: 'displayName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'varchar',
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

    // Create payments table
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
            name: 'status',
            type: 'enum',
            enum: ['pending', 'success', 'failed', 'cancelled', 'refunded'],
            default: "'pending'",
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            default: "'VND'",
          },
          {
            name: 'transactionId',
            type: 'varchar',
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
            name: 'paidAt',
            type: 'timestamp',
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

    // Create payment_transactions table
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
            isUnique: true,
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
            precision: 15,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            default: "'VND'",
          },
          {
            name: 'gatewayResponse',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'gatewayMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'processedAt',
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

    // Add new columns to orders table (check if they don't exist first)
    const ordersTable = await queryRunner.getTable('orders');
    if (ordersTable) {
      const existingColumns = ordersTable.columns.map(col => col.name);
      
      const columnsToAdd: TableColumn[] = [];
      
      if (!existingColumns.includes('paymentMethod')) {
        columnsToAdd.push(new TableColumn({
          name: 'paymentMethod',
          type: 'enum',
          enum: ['COD', 'MOMO', 'ZALOPAY', 'VNPAY'],
          default: "'COD'",
        }));
      }
      
      if (!existingColumns.includes('paymentStatus')) {
        columnsToAdd.push(new TableColumn({
          name: 'paymentStatus',
          type: 'enum',
          enum: ['pending', 'paid', 'failed', 'cancelled'],
          default: "'pending'",
        }));
      }
      
      if (!existingColumns.includes('shippingAddress')) {
        columnsToAdd.push(new TableColumn({
          name: 'shippingAddress',
          type: 'text',
          isNullable: true,
        }));
      }
      
      if (!existingColumns.includes('notes')) {
        columnsToAdd.push(new TableColumn({
          name: 'notes',
          type: 'text',
          isNullable: true,
        }));
      }
      
      if (columnsToAdd.length > 0) {
        await queryRunner.addColumns('orders', columnsToAdd);
      }
    }

    // Add foreign keys (check if they don't exist first)
    const paymentsTable = await queryRunner.getTable('payments');
    if (paymentsTable) {
      const existingForeignKeys = paymentsTable.foreignKeys.map(fk => fk.name || '');
      
      if (!existingForeignKeys.some(name => name.includes('orderId'))) {
        await queryRunner.createForeignKey(
          'payments',
          new TableForeignKey({
            name: 'FK_payments_orderId',
            columnNames: ['orderId'],
            referencedColumnNames: ['orderId'],
            referencedTableName: 'orders',
            onDelete: 'CASCADE',
          }),
        );
      }
      
      if (!existingForeignKeys.some(name => name.includes('paymentMethodId'))) {
        await queryRunner.createForeignKey(
          'payments',
          new TableForeignKey({
            name: 'FK_payments_paymentMethodId',
            columnNames: ['paymentMethodId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'payment_methods',
            onDelete: 'RESTRICT',
          }),
        );
      }
    }

    const paymentTransactionsTable = await queryRunner.getTable('payment_transactions');
    if (paymentTransactionsTable) {
      const existingForeignKeys = paymentTransactionsTable.foreignKeys.map(fk => fk.name || '');
      
      if (!existingForeignKeys.some(name => name.includes('paymentId'))) {
        await queryRunner.createForeignKey(
          'payment_transactions',
          new TableForeignKey({
            name: 'FK_payment_transactions_paymentId',
            columnNames: ['paymentId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'payments',
            onDelete: 'CASCADE',
          }),
        );
      }
    }

    // Insert default payment methods
    await queryRunner.query(`
      INSERT INTO payment_methods (name, displayName, description, isActive, sortOrder) VALUES
      ('COD', 'Thanh toán khi nhận hàng', 'Thanh toán bằng tiền mặt khi nhận hàng', true, 1),
      ('MOMO', 'Ví MoMo', 'Thanh toán qua ví điện tử MoMo', true, 2),
      ('ZALOPAY', 'Ví ZaloPay', 'Thanh toán qua ví điện tử ZaloPay', true, 3),
      ('VNPAY', 'VNPay', 'Thanh toán qua cổng VNPay', true, 4)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('payment_transactions', 'FK_payment_transactions_paymentId');
    await queryRunner.dropForeignKey('payments', 'FK_payments_paymentMethodId');
    await queryRunner.dropForeignKey('payments', 'FK_payments_orderId');

    // Drop new columns from orders table
    await queryRunner.dropColumns('orders', ['paymentMethod', 'paymentStatus', 'shippingAddress', 'notes']);

    // Drop tables
    await queryRunner.dropTable('payment_transactions');
    await queryRunner.dropTable('payments');
    await queryRunner.dropTable('payment_methods');
  }
}
