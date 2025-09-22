export enum OrderStatus {
  NEW = 'NEW',                 // Đơn hàng mới
  CONFIRMED = 'CONFIRMED',     // Đã xác nhận (thủ công hoặc tự động 30 phút)
  PREPARING = 'PREPARING',     // Shop đang chuẩn bị hàng
  SHIPPING = 'SHIPPING',       // Đang giao hàng
  DELIVERED = 'DELIVERED',     // Giao thành công
  CANCELED = 'CANCELED',       // Hủy đơn
  CANCEL_REQUEST = 'CANCEL_REQUEST', // Yêu cầu hủy khi đã chuẩn bị
}
