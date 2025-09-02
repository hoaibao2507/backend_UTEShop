# Homepage Product APIs

## Tổng quan
Các API này được thiết kế để cung cấp dữ liệu sản phẩm cho trang chủ của ứng dụng e-commerce. **Tất cả API đều cho phép tùy chỉnh số lượng sản phẩm thông qua parameter `limit`**.

## Danh sách API

### 1. Lấy sản phẩm mới nhất
```
GET /products/latest?limit=10
```
- **Mô tả**: Lấy danh sách sản phẩm mới nhất (có thể tùy chỉnh số lượng)
- **Query Parameters**:
  - `limit` (optional): Số lượng sản phẩm cần lấy (mặc định: 10)
- **Response**: Array of Product objects

### 2. Lấy sản phẩm bán chạy nhất
```
GET /products/best-selling?limit=10
```
- **Mô tả**: Lấy danh sách sản phẩm bán chạy nhất (có thể tùy chỉnh số lượng)
- **Query Parameters**:
  - `limit` (optional): Số lượng sản phẩm cần lấy (mặc định: 10)
- **Response**: Array of Product objects
- **Logic**: Dựa trên số lượng đơn hàng đã hoàn thành

### 3. Lấy sản phẩm được xem nhiều nhất
```
GET /products/most-viewed?limit=10
```
- **Mô tả**: Lấy danh sách sản phẩm được xem nhiều nhất (có thể tùy chỉnh số lượng)
- **Query Parameters**:
  - `limit` (optional): Số lượng sản phẩm cần lấy (mặc định: 10)
- **Response**: Array of Product objects
- **Logic**: Dựa trên số lượng lượt xem từ bảng ProductView

### 4. Lấy sản phẩm khuyến mãi cao nhất
```
GET /products/top-discount?limit=10
```
- **Mô tả**: Lấy danh sách sản phẩm có khuyến mãi cao nhất (có thể tùy chỉnh số lượng)
- **Query Parameters**:
  - `limit` (optional): Số lượng sản phẩm cần lấy (mặc định: 10)
- **Response**: Array of Product objects
- **Logic**: Sắp xếp theo discountPercent giảm dần

### 5. Lấy tất cả sản phẩm cho trang chủ (API tổng hợp)
```
GET /products/homepage?latestLimit=8&bestSellingLimit=6&mostViewedLimit=8&topDiscountLimit=4
```
- **Mô tả**: Lấy tất cả các loại sản phẩm cho trang chủ trong một API call (có thể tùy chỉnh số lượng cho từng loại)
- **Query Parameters**:
  - `latestLimit` (optional): Số lượng sản phẩm mới nhất (mặc định: 8)
  - `bestSellingLimit` (optional): Số lượng sản phẩm bán chạy (mặc định: 6)
  - `mostViewedLimit` (optional): Số lượng sản phẩm xem nhiều (mặc định: 8)
  - `topDiscountLimit` (optional): Số lượng sản phẩm khuyến mãi (mặc định: 4)
- **Response**: Object chứa 4 arrays:
  ```json
  {
    "latestProducts": [...],      // Sản phẩm mới nhất
    "bestSellingProducts": [...], // Sản phẩm bán chạy nhất
    "mostViewedProducts": [...],  // Sản phẩm được xem nhiều nhất
    "topDiscountProducts": [...]  // Sản phẩm khuyến mãi cao nhất
  }
  ```

## Đặc điểm chung

### Điều kiện lọc
- Tất cả API chỉ trả về sản phẩm còn hàng (`stockQuantity > 0`)
- Bao gồm thông tin category và images trong response

### Performance
- API `/products/homepage` sử dụng `Promise.all()` để gọi song song các method, tối ưu performance
- Các API riêng lẻ có thể được cache riêng biệt

### Sử dụng trong Frontend

#### Cách 1: Sử dụng API tổng hợp (Khuyến nghị)
```javascript
// Gọi một lần để lấy tất cả dữ liệu với số lượng tùy chỉnh
const response = await fetch('/products/homepage?latestLimit=8&bestSellingLimit=6&mostViewedLimit=8&topDiscountLimit=4');
const data = await response.json();

// Sử dụng dữ liệu
const latestProducts = data.latestProducts;
const bestSellingProducts = data.bestSellingProducts;
const mostViewedProducts = data.mostViewedProducts;
const topDiscountProducts = data.topDiscountProducts;
```

#### Cách 2: Sử dụng API riêng lẻ
```javascript
// Gọi từng API riêng biệt với số lượng tùy chỉnh
const [latest, bestSelling, mostViewed, topDiscount] = await Promise.all([
  fetch('/products/latest?limit=8'),
  fetch('/products/best-selling?limit=6'),
  fetch('/products/most-viewed?limit=8'),
  fetch('/products/top-discount?limit=4')
]);

const latestProducts = await latest.json();
const bestSellingProducts = await bestSelling.json();
const mostViewedProducts = await mostViewed.json();
const topDiscountProducts = await topDiscount.json();
```

#### Ví dụ sử dụng linh hoạt
```javascript
// Lấy nhiều sản phẩm hơn cho trang danh sách
const response = await fetch('/products/latest?limit=20');

// Lấy ít sản phẩm hơn cho mobile
const response = await fetch('/products/latest?limit=4');

// Tùy chỉnh từng loại sản phẩm cho trang chủ
const response = await fetch('/products/homepage?latestLimit=12&bestSellingLimit=8&mostViewedLimit=10&topDiscountLimit=6');
```

## Lưu ý
- Tất cả API đều không yêu cầu authentication
- Response format nhất quán với các API sản phẩm khác
- **Có thể tùy chỉnh số lượng sản phẩm thông qua query parameter `limit`**
- Nếu không truyền `limit`, API sẽ sử dụng giá trị mặc định
- API tổng hợp `/products/homepage` cho phép tùy chỉnh số lượng cho từng loại sản phẩm riêng biệt
- Tất cả API chỉ trả về sản phẩm còn hàng (`stockQuantity > 0`)
