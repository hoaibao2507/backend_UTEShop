import {
  Controller,
  Post,
  Delete,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';
import {
  UploadFileDto,
  UploadMultipleFilesDto,
  DeleteFileDto,
  ResourceType,
} from './dto/upload.dto';

@ApiTags('Cloudinary')
@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a single file to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          example: 'products',
        },
        resourceType: {
          type: 'string',
          enum: ['image', 'video', 'raw', 'auto'],
          default: 'auto',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
    @Body('resourceType') resourceType?: ResourceType,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      const result = await this.cloudinaryService.uploadFile(
        file,
        folder,
        resourceType || ResourceType.AUTO,
      );

      return {
        message: 'File uploaded successfully',
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          resourceType: result.resource_type,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          createdAt: result.created_at,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  @Post('upload-multiple')
  @ApiOperation({ summary: 'Upload multiple files to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        folder: {
          type: 'string',
          example: 'products',
        },
        resourceType: {
          type: 'string',
          enum: ['image', 'video', 'raw', 'auto'],
          default: 'auto',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
  })
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
    @Body('resourceType') resourceType?: ResourceType,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    try {
      const results = await this.cloudinaryService.uploadMultipleFiles(
        files,
        folder,
        resourceType || ResourceType.AUTO,
      );

      return {
        message: `${results.length} file(s) uploaded successfully`,
        data: results.map((result) => ({
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          resourceType: result.resource_type,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          createdAt: result.created_at,
        })),
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Delete a file from Cloudinary' })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
  })
  async deleteFile(@Body() deleteFileDto: DeleteFileDto) {
    try {
      const result = await this.cloudinaryService.deleteFile(
        deleteFileDto.publicId,
        deleteFileDto.resourceType || 'image',
      );

      return {
        message: 'File deleted successfully',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(`Delete failed: ${error.message}`);
    }
  }

  @Get('details/:publicId')
  @ApiOperation({ summary: 'Get file details from Cloudinary' })
  @ApiResponse({
    status: 200,
    description: 'File details retrieved successfully',
  })
  async getFileDetails(
    @Param('publicId') publicId: string,
    @Query('resourceType') resourceType?: 'image' | 'video' | 'raw',
  ) {
    try {
      // Replace URL-encoded slashes with actual slashes
      const decodedPublicId = publicId.replace(/%2F/g, '/');
      
      const result = await this.cloudinaryService.getFileDetails(
        decodedPublicId,
        resourceType || 'image',
      );

      return {
        message: 'File details retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get file details: ${error.message}`);
    }
  }

  @Post('optimized-url')
  @ApiOperation({ summary: 'Get optimized image URL with transformations' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        publicId: {
          type: 'string',
          example: 'uteshop/product_abc123',
        },
        transformations: {
          type: 'object',
          example: {
            width: 500,
            height: 500,
            crop: 'fill',
            quality: 'auto',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Optimized URL generated successfully',
  })
  async getOptimizedUrl(
    @Body('publicId') publicId: string,
    @Body('transformations') transformations?: any,
  ) {
    if (!publicId) {
      throw new BadRequestException('Public ID is required');
    }

    const url = this.cloudinaryService.getOptimizedImageUrl(
      publicId,
      transformations,
    );

    return {
      message: 'Optimized URL generated successfully',
      data: { url },
    };
  }
}
