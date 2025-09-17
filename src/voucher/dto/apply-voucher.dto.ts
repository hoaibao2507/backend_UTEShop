import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class ApplyVoucherDto {
    @IsString()
    @IsNotEmpty()
    code: string;

    @IsNumber()
    @Min(0)
    orderAmount: number;
}


