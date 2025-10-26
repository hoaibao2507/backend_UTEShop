import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'uteshop'): Promise<string> {
    try {
      // Check if file is from disk storage (has path) or memory storage (has buffer)
      if (file.path) {
        // File uploaded to disk
        const result = await cloudinary.uploader.upload(file.path, {
          folder: folder,
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
        });
        
        return result.secure_url;
      } else if (file.buffer) {
        // File uploaded to memory, upload using buffer
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          {
            folder: folder,
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto',
          }
        );
        
        return result.secure_url;
      } else {
        throw new Error('File has neither path nor buffer');
      }
    } catch (error) {
      throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
    }
  }

  async uploadImageFromBuffer(buffer: Buffer, folder: string = 'uteshop'): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${buffer.toString('base64')}`,
        {
          folder: folder,
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
        }
      );
      
      return result.secure_url;
    } catch (error) {
      throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new Error(`Failed to delete image from Cloudinary: ${error.message}`);
    }
  }

  extractPublicId(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
  }
}