import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod as PaymentMethodEntity } from '../entities/payment-method.entity';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto/payment-method.dto';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethodEntity)
    private paymentMethodRepository: Repository<PaymentMethodEntity>,
  ) {}

  async create(createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethodEntity> {
    // Check if payment method with same name already exists
    const existingMethod = await this.paymentMethodRepository.findOne({
      where: { name: createPaymentMethodDto.name },
    });

    if (existingMethod) {
      throw new ConflictException(`Payment method with name '${createPaymentMethodDto.name}' already exists`);
    }

    const paymentMethod = this.paymentMethodRepository.create(createPaymentMethodDto);
    return this.paymentMethodRepository.save(paymentMethod);
  }

  async findAll(): Promise<PaymentMethodEntity[]> {
    return this.paymentMethodRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<PaymentMethodEntity[]> {
    return this.paymentMethodRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: number): Promise<PaymentMethodEntity> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id },
    });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }

    return paymentMethod;
  }

  async findByName(name: string): Promise<PaymentMethodEntity> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { name },
    });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with name '${name}' not found`);
    }

    return paymentMethod;
  }

  async update(id: number, updatePaymentMethodDto: UpdatePaymentMethodDto): Promise<PaymentMethodEntity> {
    const paymentMethod = await this.findOne(id);

    // Check if updating name and if it conflicts with existing
    if (updatePaymentMethodDto.name && updatePaymentMethodDto.name !== paymentMethod.name) {
      const existingMethod = await this.paymentMethodRepository.findOne({
        where: { name: updatePaymentMethodDto.name },
      });

      if (existingMethod) {
        throw new ConflictException(`Payment method with name '${updatePaymentMethodDto.name}' already exists`);
      }
    }

    Object.assign(paymentMethod, updatePaymentMethodDto);
    return this.paymentMethodRepository.save(paymentMethod);
  }

  async remove(id: number): Promise<void> {
    const paymentMethod = await this.findOne(id);
    await this.paymentMethodRepository.remove(paymentMethod);
  }

  async toggleActive(id: number): Promise<PaymentMethodEntity> {
    const paymentMethod = await this.findOne(id);
    paymentMethod.isActive = !paymentMethod.isActive;
    return this.paymentMethodRepository.save(paymentMethod);
  }
}

