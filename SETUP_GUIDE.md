# 🚀 SETUP GUIDE - Backend UTEShop

## 📋 Tổng quan
Hệ thống backend đã được phát triển từ User entity đơn giản thành một hệ thống e-commerce hoàn chỉnh với nhiều tính năng mới.

## 🗄️ Database Schema Mới

### **Entities đã thêm:**
- ✅ **Admin** - Quản trị viên hệ thống
- ✅ **Vendor** - Nhà cung cấp  
- ✅ **Product** - Sản phẩm
- ✅ **Category** - Danh mục
- ✅ **Order** - Đơn hàng
- ✅ **Cart** - Giỏ hàng
- ✅ **ProductImage** - Hình ảnh sản phẩm
- ✅ **ProductReview** - Đánh giá sản phẩm
- ✅ **ProductView** - Lượt xem sản phẩm
- ✅ **Wishlist** - Danh sách yêu thích
- ✅ **Voucher** - Mã giảm giá

## 🔧 Các bước setup

### **Bước 1: Clone và Install Dependencies**
```bash
git clone <repository-url>
cd backend_UTEShop
npm install
```

### **Bước 2: Cấu hình Environment**
```bash
# Copy file .env.example thành .env
cp .env.example .env

# Cập nhật các thông tin trong .env:
# - DATABASE_HOST
# - DATABASE_PORT  
# - DATABASE_USERNAME
# - DATABASE_PASSWORD
# - DATABASE_NAME
# - JWT_SECRET
```

### **Bước 3: Chạy Migrations**
```bash
# Tạo migration cho các bảng mới (nếu chưa có)
npm run migration:generate -- AddNewTables

# Chạy migrations để tạo bảng
npm run migration:run
```

### **Bước 4: Seed Data**
```bash
# Chạy seed để tạo dữ liệu mẫu
npm run seed:run
```

### **Bước 5: Khởi động Server**
```bash
npm run start:dev
```

## 👥 Tài khoản mặc định

### **Admin Account:**
```
Username: admin
Password: admin123
Role: SUPER_ADMIN
```

### **Staff Account:**
```
Email: staff.test@example.com
Password: staff123
Role: STAFF
```

### **Vendor Account:**
```
Username: vendor_abc
Password: vendor123
Email: vendor1@example.com
Status: active
```

### **Customer Account:**
```
Email: customer@uteshop.com
Password: customer123
Role: CUSTOMER
```

## 🔐 Authentication System

### **JWT Token Types:**
- `admin` - Admin tokens
- `staff` - Staff tokens  
- `vendor` - Vendor tokens
- `customer` - Customer tokens

### **Role-based Access:**
- **Admin**: Full access to all endpoints
- **Manager**: Staff management + limited admin access
- **Staff**: Profile management + assigned tasks
- **Vendor**: Product management + order handling
- **Customer**: Shopping + profile management

## 📡 API Endpoints Chính

### **Authentication:**
- `POST /admin-auth/login` - Admin login
- `POST /staff-auth/login` - Staff login
- `POST /vendor-auth/login` - Vendor login
- `POST /auth/login` - Customer login

### **Customer Management:**
- `GET /users/getAll` - Lấy danh sách khách hàng (chỉ customer)
- `GET /users/profile` - Profile khách hàng hiện tại
- `POST /users/upload-avatar` - Upload avatar

### **Admin Management:**
- `GET /admin/profile` - Admin profile
- `PATCH /admin/profile` - Update admin profile

### **Staff Management:**
- `GET /staff` - Staff list (Manager only)
- `POST /staff` - Create staff (Manager only)
- `PATCH /staff/:id` - Update staff (Manager only)
- `PATCH /staff/profile` - Update own profile

### **Vendor Management:**
- `GET /vendors` - Vendor list
- `POST /vendors/register` - Vendor registration
- `PUT /vendors/:id/approve` - Approve vendor

### **Product Management:**
- `GET /products` - Product list
- `POST /products` - Create product (Vendor)
- `PATCH /products/:id` - Update product

### **Order Management:**
- `GET /orders` - Order list
- `POST /orders` - Create order
- `PATCH /orders/:id/status` - Update order status

## 🚨 Lưu ý quan trọng

### **Database:**
- Đảm bảo MySQL server đang chạy
- Database phải tồn tại trước khi chạy migrations
- Backup database trước khi chạy migrations mới

### **File Uploads:**
- Thư mục `uploads/` sẽ được tạo tự động
- Avatar: `uploads/avatars/`
- Product images: `uploads/products/`

### **Environment Variables:**
- `JWT_SECRET` phải được set
- Database connection string phải đúng
- Port 3001 phải available

## 🔍 Troubleshooting

### **Lỗi Database Connection:**
```bash
# Kiểm tra MySQL service
sudo service mysql status

# Kiểm tra database tồn tại
mysql -u root -p
SHOW DATABASES;
```

### **Lỗi Migration:**
```bash
# Reset migrations
npm run migration:revert

# Chạy lại migrations
npm run migration:run
```

### **Lỗi Seed:**
```bash
# Chạy seed riêng lẻ
npm run seed:admin
npm run seed:staff
npm run seed:vendor
```

## 📞 Support

Nếu gặp vấn đề trong quá trình setup, liên hệ team lead hoặc tạo issue trong repository.

---

**Chúc các bạn setup thành công! 🎉**

