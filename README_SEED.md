# Hướng dẫn Seed Data

## Cài đặt và chạy seed data

### 1. Cấu hình Database
Tạo file `.env` trong thư mục gốc với nội dung:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=uteshop

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Email Configuration (for OTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password

# Application Configuration
PORT=3000
NODE_ENV=development
```

### 2. Tạo Database
Tạo database MySQL với tên `uteshop` (hoặc tên khác tùy theo cấu hình của bạn).

### 3. Chạy Migration (nếu có)
```bash
npm run migration:run
```

### 4. Chạy Seed Data
```bash
npm run seed
```

Hoặc:
```bash
npm run seed:run
```

## Dữ liệu được seed

### Categories (6 danh mục)
- Điện thoại
- Laptop  
- Phụ kiện
- Đồng hồ thông minh
- Máy tính bảng
- Tivi & Âm thanh

### Users (5 người dùng)
- Nguyễn Văn An (nguyenvanan@example.com)
- Trần Thị Bình (tranthibinh@example.com)
- Lê Minh Cường (leminhcuong@example.com)
- Phạm Thị Dung (phamthidung@example.com)
- Hoàng Văn Em (hoangvanem@example.com)

**Mật khẩu mặc định cho tất cả user: `password123`**

### Products (15 sản phẩm)
- 3 điện thoại (iPhone 15 Pro Max, Samsung Galaxy S24 Ultra, Xiaomi 14 Pro)
- 3 laptop (MacBook Pro, Dell XPS 15, ASUS ROG Strix G15)
- 3 phụ kiện (AirPods Pro 2, Samsung Galaxy Buds2 Pro, MagSafe Charger)
- 2 đồng hồ thông minh (Apple Watch Series 9, Samsung Galaxy Watch6 Classic)
- 2 máy tính bảng (iPad Pro, Samsung Galaxy Tab S9 Ultra)
- 2 tivi & âm thanh (Samsung QLED TV, Sony WH-1000XM5)

### Dữ liệu khác
- **Product Images**: Mỗi sản phẩm có 3-5 hình ảnh
- **Product Reviews**: Mỗi sản phẩm có 3-8 đánh giá từ người dùng
- **Orders**: 20 đơn hàng với trạng thái ngẫu nhiên
- **Order Details**: Chi tiết đơn hàng với 1-3 sản phẩm mỗi đơn
- **Carts**: Giỏ hàng cho 70% người dùng với 1-3 sản phẩm
- **Product Views**: 10-50 lượt xem cho mỗi sản phẩm

## Lưu ý
- Script seed sẽ xóa toàn bộ dữ liệu cũ trước khi thêm dữ liệu mới
- Đảm bảo database đã được tạo và cấu hình đúng
- Tất cả mật khẩu user đều được hash bằng bcrypt
- Dữ liệu được tạo ngẫu nhiên để mô phỏng thực tế
