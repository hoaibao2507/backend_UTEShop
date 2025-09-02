import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    categoryName: string;

    @IsString()
    @IsOptional()
    description?: string;
}

export class UpdateCategoryDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    categoryName?: string;

    @IsString()
    @IsOptional()
    description?: string;
}
