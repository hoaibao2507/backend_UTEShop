import { Injectable } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

export type CloudinaryResponse = UploadApiResponse | UploadApiErrorResponse;

@Injectable()
export class CloudinaryService {
  /**
   * Upload file to Cloudinary
   * @param file - Express.Multer.File object
   * @param folder - Optional folder name in Cloudinary
   * @param resourceType - Type of resource: 'image', 'video', 'raw', 'auto'
   * @returns Promise with Cloudinary response
   */
  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto',
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadOptions: any = {
        folder: folder || 'uteshop',
        resource_type: resourceType,
      };

      // For documents and other files, use 'raw' resource type
      if (resourceType === 'raw') {
        uploadOptions.use_filename = true;
        uploadOptions.unique_filename = true;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload failed: No result returned'));
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload multiple files to Cloudinary
   * @param files - Array of Express.Multer.File objects
   * @param folder - Optional folder name in Cloudinary
   * @param resourceType - Type of resource: 'image', 'video', 'raw', 'auto'
   * @returns Promise with array of Cloudinary responses
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder?: string,
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto',
  ): Promise<CloudinaryResponse[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, folder, resourceType),
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Delete file from Cloudinary
   * @param publicId - Public ID of the file to delete
   * @param resourceType - Type of resource: 'image', 'video', 'raw'
   * @returns Promise with deletion result
   */
  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<any> {
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }

  /**
   * Delete multiple files from Cloudinary
   * @param publicIds - Array of public IDs to delete
   * @param resourceType - Type of resource: 'image', 'video', 'raw'
   * @returns Promise with deletion result
   */
  async deleteMultipleFiles(
    publicIds: string[],
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<any> {
    return cloudinary.api.delete_resources(publicIds, { resource_type: resourceType });
  }

  /**
   * Get file details from Cloudinary
   * @param publicId - Public ID of the file
   * @param resourceType - Type of resource: 'image', 'video', 'raw'
   * @returns Promise with file details
   */
  async getFileDetails(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<any> {
    return cloudinary.api.resource(publicId, { resource_type: resourceType });
  }

  /**
   * Generate a signed URL for private resources
   * @param publicId - Public ID of the file
   * @param options - Additional options for URL generation
   * @returns Signed URL
   */
  generateSignedUrl(publicId: string, options?: any): string {
    return cloudinary.url(publicId, {
      sign_url: true,
      ...options,
    });
  }

  /**
   * Get optimized image URL with transformations
   * @param publicId - Public ID of the image
   * @param transformations - Cloudinary transformation options
   * @returns Transformed image URL
   */
  getOptimizedImageUrl(publicId: string, transformations?: any): string {
    return cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: 'auto',
      ...transformations,
    });
  }
}
