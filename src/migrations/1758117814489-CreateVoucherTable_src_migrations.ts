import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateVoucherTable1758117814489 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'vouchers',
      columns: [
        {
          name: 'id',
          type: 'int',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'increment'
        },
        {
          name: 'code',
          type: 'varchar',
          length: '50',
          isUnique: true,
          isNullable: false
        },
        {
          name: 'description',
          type: 'varchar',
          length: '255',
          isNullable: true
        },
        {
          name: 'discount_type',
          type: 'enum',
          enum: ['percentage', 'fixed', 'freeship'],
          enumName: 'voucher_discount_type',
          default: "'percentage'"
        },
        {
          name: 'discount_value',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: true
        },
        {
          name: 'min_order_value',
          type: 'decimal',
          precision: 10,
          scale: 2,
          default: 0
        },
        {
          name: 'max_discount',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: true
        },
        {
          name: 'start_date',
          type: 'timestamp',
          isNullable: false
        },
        {
          name: 'end_date',
          type: 'timestamp',
          isNullable: false
        },
        {
          name: 'usage_limit',
          type: 'int',
          isNullable: true
        },
        {
          name: 'used_count',
          type: 'int',
          default: 0
        },
        {
          name: 'per_user_limit',
          type: 'int',
          isNullable: true
        },
        {
          name: 'combinable',
          type: 'boolean',
          default: false
        },
        {
          name: 'is_active',
          type: 'boolean',
          default: true
        },
        {
          name: 'is_deleted',
          type: 'boolean',
          default: false
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP'
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
          onUpdate: 'CURRENT_TIMESTAMP'
        }
      ]
    }), true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('vouchers');
  }
}