import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { ApplyVoucherDto } from './dto/apply-voucher.dto';

@Controller('vouchers')
export class VoucherController {
    constructor(private readonly voucherService: VoucherService) {}

    @Post()
    create(@Body() dto: CreateVoucherDto) {
        return this.voucherService.create(dto);
    }

    @Get()
    findAll() {
        return this.voucherService.findAll();
    }

    @Get('available')
    getAvailableVouchers(@Query('userId', ParseIntPipe) userId: number, @Query('orderAmount', ParseIntPipe) orderAmount: number) {
        return this.voucherService.getAvailableVouchers(userId, orderAmount);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVoucherDto) {
        return this.voucherService.update(id, dto);
    }

    @Delete(':id')
    deactivate(@Param('id', ParseIntPipe) id: number) {
        return this.voucherService.deactivate(id);
    }

    @Delete(':id/hard')
    hardDelete(@Param('id', ParseIntPipe) id: number) {
        return this.voucherService.hardDelete(id);
    }

    @Post('apply')
    apply(@Body() dto: ApplyVoucherDto) {
        return this.voucherService.apply(dto);
    }

    @Post('validate-user')
    validateForUser(@Body() dto: { code: string; userId: number; orderAmount: number }) {
        return this.voucherService.validateVoucherForUser(dto.code, dto.userId, dto.orderAmount);
    }
}


