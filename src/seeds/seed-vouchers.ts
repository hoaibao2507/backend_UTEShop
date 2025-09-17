import { AppDataSource } from '../data-source';
import { Voucher } from '../entities/voucher.entity';
import { VoucherDiscountType } from '../entities/enums/voucher-discount-type.enum';

async function seedVouchers() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Voucher);

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(now.getMonth() + 1);

  const items: Partial<Voucher>[] = [
    {
      code: 'SALE10',
      description: 'Giảm 10% tối đa 50k',
      discountType: VoucherDiscountType.PERCENTAGE,
      discountValue: 10,
      minOrderValue: 100000,
      maxDiscount: 50000,
      startDate: now,
      endDate: nextMonth,
      usageLimit: 1000,
      usedCount: 0,
      isActive: true,
      combinable: false,
    },
    {
      code: 'FIX50K',
      description: 'Giảm thẳng 50k',
      discountType: VoucherDiscountType.FIXED,
      discountValue: 50000,
      minOrderValue: 200000,
      startDate: now,
      endDate: nextMonth,
      usageLimit: 500,
      usedCount: 0,
      isActive: true,
      combinable: false,
    },
    {
      code: 'FREESHIP',
      description: 'Miễn phí vận chuyển',
      discountType: VoucherDiscountType.FREESHIP,
      minOrderValue: 100000,
      startDate: now,
      endDate: nextMonth,
      usageLimit: 1000,
      usedCount: 0,
      isActive: true,
      combinable: true,
    },
  ];

  for (const item of items) {
    const code = (item.code as string).toUpperCase();
    const found = await repo.findOne({ where: { code } });
    if (found) {
      await repo.update({ id: found.id }, { ...item, code });
      // eslint-disable-next-line no-console
      console.log(`Updated voucher ${code}`);
    } else {
      const entity = repo.create({ ...item, code });
      await repo.save(entity);
      // eslint-disable-next-line no-console
      console.log(`Inserted voucher ${code}`);
    }
  }

  await AppDataSource.destroy();
}

seedVouchers().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  try { await AppDataSource.destroy(); } catch {}
  process.exit(1);
});


