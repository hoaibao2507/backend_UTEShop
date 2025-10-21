# Cloudinary Integration

Tích hợp Cloudinary API để upload và quản lý images, videos, documents và các file khác.

## Cấu hình

### 1. Thêm biến môi trường vào file `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Lấy thông tin từ Cloudinary Dashboard:

1. Đăng ký tài khoản tại [Cloudinary](https://cloudinary.com/)
2. Vào Dashboard để lấy:
   - Cloud Name
   - API Key
   - API Secret

## API Endpoints

### 1. Upload một file

**POST** `/cloudinary/upload`

**Content-Type:** `multipart/form-data`

**Body:**
- `file` (file) - File cần upload
- `folder` (string, optional) - Tên folder trên Cloudinary (mặc định: "uteshop")
- `resourceType` (string, optional) - Loại file: "image", "video", "raw", "auto" (mặc định: "auto")

**Response:**
```json
{
  "message": "File uploaded successfully",
  "data": {
    "publicId": "uteshop/abc123",
    "url": "https://res.cloudinary.com/...",
    "format": "jpg",
    "resourceType": "image",
    "bytes": 123456,
    "width": 1920,
    "height": 1080,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Upload nhiều files

**POST** `/cloudinary/upload-multiple`

**Content-Type:** `multipart/form-data`

**Body:**
- `files` (file[]) - Mảng các file cần upload (tối đa 10 files)
- `folder` (string, optional) - Tên folder trên Cloudinary
- `resourceType` (string, optional) - Loại file

**Response:**
```json
{
  "message": "3 file(s) uploaded successfully",
  "data": [
    {
      "publicId": "uteshop/abc123",
      "url": "https://res.cloudinary.com/...",
      ...
    }
  ]
}
```

### 3. Xóa file

**DELETE** `/cloudinary/delete`

**Body:**
```json
{
  "publicId": "uteshop/abc123",
  "resourceType": "image"
}
```

### 4. Lấy thông tin file

**GET** `/cloudinary/details/:publicId?resourceType=image`

**Params:**
- `publicId` - Public ID của file (encode URL nếu có dấu "/")
- `resourceType` (query, optional) - Loại file: "image", "video", "raw"

### 5. Tạo URL tối ưu với transformations

**POST** `/cloudinary/optimized-url`

**Body:**
```json
{
  "publicId": "uteshop/product_abc123",
  "transformations": {
    "width": 500,
    "height": 500,
    "crop": "fill",
    "quality": "auto"
  }
}
```

## Sử dụng CloudinaryService trong module khác

### 1. Import CloudinaryModule:

```typescript
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  // ...
})
export class YourModule {}
```

### 2. Inject CloudinaryService:

```typescript
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class YourService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadProductImage(file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadFile(
      file,
      'products',
      'image'
    );
    return result.secure_url;
  }

  async deleteProductImage(publicId: string) {
    await this.cloudinaryService.deleteFile(publicId, 'image');
  }
}
```

## Các loại Resource Type

- **image**: Ảnh (jpg, png, gif, webp, svg, ...)
- **video**: Video (mp4, avi, mov, ...)
- **raw**: Tài liệu và file khác (pdf, docx, xlsx, zip, ...)
- **auto**: Tự động nhận diện (khuyến nghị)

## Transformations

Cloudinary hỗ trợ nhiều transformations cho images và videos:

```typescript
// Resize ảnh
{
  width: 500,
  height: 500,
  crop: 'fill'
}

// Tối ưu chất lượng
{
  quality: 'auto',
  fetch_format: 'auto'
}

// Thêm watermark
{
  overlay: 'logo',
  gravity: 'south_east',
  opacity: 50
}

// Làm mờ background
{
  effect: 'blur:300'
}
```

## Best Practices

1. **Sử dụng folders**: Tổ chức files theo folders (products, users, documents, ...)
2. **Resource type phù hợp**: Chọn đúng resource type để tối ưu storage và bandwidth
3. **Transformations**: Sử dụng transformations để tối ưu kích thước và chất lượng
4. **Xóa files không dùng**: Thường xuyên xóa files không còn sử dụng để tiết kiệm storage
5. **Signed URLs**: Sử dụng signed URLs cho private resources

## Ví dụ Upload trong Controller

```typescript
@Post('product/image')
@UseInterceptors(FileInterceptor('image'))
async uploadProductImage(
  @UploadedFile() file: Express.Multer.File,
  @Body('productId') productId: string,
) {
  const result = await this.cloudinaryService.uploadFile(
    file,
    'products',
    'image'
  );

  // Lưu URL vào database
  await this.productService.updateImage(productId, result.secure_url);

  return { url: result.secure_url };
}
```

## Giới hạn

- Free tier: 25 GB storage, 25 GB bandwidth/tháng
- Max file size: 100 MB (free tier)
- Max video length: 10 phút (free tier)

Xem thêm tại: https://cloudinary.com/pricing
