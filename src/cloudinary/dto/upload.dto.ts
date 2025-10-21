import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ResourceType {
  IMAGE = 'image',
  VIDEO = 'video',
  RAW = 'raw',
  AUTO = 'auto',
}

export class UploadFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload',
  })
  file: Express.Multer.File;

  @ApiProperty({
    description: 'Folder name in Cloudinary',
    required: false,
    example: 'products',
  })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiProperty({
    description: 'Resource type',
    enum: ResourceType,
    required: false,
    default: ResourceType.AUTO,
  })
  @IsOptional()
  @IsEnum(ResourceType)
  resourceType?: ResourceType;
}

export class UploadMultipleFilesDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Files to upload',
  })
  files: Express.Multer.File[];

  @ApiProperty({
    description: 'Folder name in Cloudinary',
    required: false,
    example: 'products',
  })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiProperty({
    description: 'Resource type',
    enum: ResourceType,
    required: false,
    default: ResourceType.AUTO,
  })
  @IsOptional()
  @IsEnum(ResourceType)
  resourceType?: ResourceType;
}

export class DeleteFileDto {
  @ApiProperty({
    description: 'Public ID of the file to delete',
    example: 'uteshop/product_abc123',
  })
  @IsString()
  publicId: string;

  @ApiProperty({
    description: 'Resource type',
    enum: ['image', 'video', 'raw'],
    required: false,
    default: 'image',
  })
  @IsOptional()
  @IsEnum(['image', 'video', 'raw'])
  resourceType?: 'image' | 'video' | 'raw';
}
