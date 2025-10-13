import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher } from '../entities/voucher.entity';
import { VoucherDiscountType } from '../entities/enums/voucher-discount-type.enum';
import { OrderVoucher } from '../entities/order-voucher.entity';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { ApplyVoucherDto } from './dto/apply-voucher.dto';

@Injectable()
export class VoucherService {
    constructor(
        @InjectRepository(Voucher) private readonly voucherRepo: Repository<Voucher>,
        @InjectRepository(OrderVoucher) private readonly orderVoucherRepo: Repository<OrderVoucher>,
    ) {}

    async create(dto: CreateVoucherDto): Promise<Voucher> {
        const normalizedCode = dto.code.trim().toUpperCase();
        const exists = await this.voucherRepo.findOne({ where: { code: normalizedCode } });
        if (exists) throw new BadRequestException('Voucher code already exists');

        const voucher = this.voucherRepo.create({
            code: normalizedCode,
            description: dto.description,
            discountType: dto.discountType,
            discountValue: dto.discountValue,
            minOrderValue: dto.minOrderValue,
            maxDiscount: dto.maxDiscount,
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
            usageLimit: dto.usageLimit,
            perUserLimit: dto.perUserLimit,
            combinable: dto.combinable ?? false,
            isActive: dto.isActive ?? true,
        });
        return this.voucherRepo.save(voucher);
    }

    findAll(): Promise<Voucher[]> {
        return this.voucherRepo.find();
    }

    async update(id: number, dto: UpdateVoucherDto): Promise<Voucher> {
        const voucher = await this.voucherRepo.findOne({ where: { id } });
        if (!voucher) throw new NotFoundException('Voucher not found');

        if (dto.code) voucher.code = dto.code.trim().toUpperCase();
        if (dto.description !== undefined) voucher.description = dto.description;
        if (dto.discountType !== undefined) voucher.discountType = dto.discountType;
        if (dto.discountValue !== undefined) voucher.discountValue = dto.discountValue;
        if (dto.minOrderValue !== undefined) voucher.minOrderValue = dto.minOrderValue;
        if (dto.maxDiscount !== undefined) voucher.maxDiscount = dto.maxDiscount;
        if (dto.startDate !== undefined) voucher.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined) voucher.endDate = new Date(dto.endDate);
        if (dto.usageLimit !== undefined) voucher.usageLimit = dto.usageLimit;
        if (dto.perUserLimit !== undefined) voucher.perUserLimit = dto.perUserLimit;
        if (dto.combinable !== undefined) voucher.combinable = dto.combinable;
        if (dto.isActive !== undefined) voucher.isActive = dto.isActive;

        return this.voucherRepo.save(voucher);
    }

    async deactivate(id: number): Promise<void> {
        const voucher = await this.voucherRepo.findOne({ where: { id } });
        if (!voucher) throw new NotFoundException('Voucher not found');
        voucher.isActive = false;
        await this.voucherRepo.save(voucher);
    }

    async hardDelete(id: number): Promise<void> {
        const voucher = await this.voucherRepo.findOne({ where: { id } });
        if (!voucher) throw new NotFoundException('Voucher not found');
        
        // Kiểm tra xem voucher có đang được sử dụng trong đơn hàng không
        const orderVoucher = await this.orderVoucherRepo.findOne({ where: { voucherId: id } });
        if (orderVoucher) {
            throw new BadRequestException('Cannot delete voucher that has been used in orders');
        }
        
        await this.voucherRepo.remove(voucher);
    }

    async apply(dto: ApplyVoucherDto): Promise<{ valid: boolean; discount: number; finalAmount: number; voucher?: Voucher }>{
        const code = dto.code.trim().toUpperCase();
        const voucher = await this.voucherRepo.findOne({ where: { code } });
        if (!voucher) throw new NotFoundException('Voucher not found');

        this.assertVoucherUsable(voucher, dto.orderAmount);

        const discount = this.calculateDiscount(voucher, dto.orderAmount);
        const finalAmount = Math.max(0, dto.orderAmount - discount);
        return { valid: true, discount, finalAmount, voucher };
    }

    private assertVoucherUsable(voucher: Voucher, orderAmount: number) {
        const now = new Date();
        if (!voucher.isActive) throw new BadRequestException('Voucher is inactive');
        if (now < voucher.startDate || now > voucher.endDate) throw new BadRequestException('Voucher is not in valid period');
        if (voucher.usageLimit !== null && voucher.usageLimit !== undefined && voucher.usedCount >= voucher.usageLimit) {
            throw new BadRequestException('Voucher usage limit reached');
        }
        if (orderAmount < Number(voucher.minOrderValue)) throw new BadRequestException('Order does not meet minimum amount');
    }

    private calculateDiscount(voucher: Voucher, orderAmount: number): number {
        switch (voucher.discountType) {
            case VoucherDiscountType.PERCENTAGE: {
                const raw = (Number(voucher.discountValue ?? 0) / 100) * orderAmount;
                const capped = voucher.maxDiscount != null ? Math.min(raw, Number(voucher.maxDiscount)) : raw;
                return Math.max(0, Math.floor(capped));
            }
            case VoucherDiscountType.FIXED: {
                return Math.max(0, Math.min(orderAmount, Number(voucher.discountValue ?? 0)));
            }
            case VoucherDiscountType.FREESHIP: {
                // For simplicity: freeship as zero discount here; usually shipping calc elsewhere.
                return 0;
            }
            default:
                return 0;
        }
    }
}



