import { DataSource } from 'typeorm';
import { NotificationTemplate, NotificationTemplateType } from '../entities/notification-template.entity';

export async function seedNotificationTemplates(dataSource: DataSource) {
  console.log('🌱 Seeding notification templates...');

  const templateRepository = dataSource.getRepository(NotificationTemplate);

  // Check if templates already exist
  const existingTemplates = await templateRepository.count();
  if (existingTemplates > 0) {
    console.log('📋 Notification templates already exist, skipping...');
    return;
  }

  const templates = [
    {
      type: NotificationTemplateType.ORDER_STATUS_UPDATE,
      titleTemplate: 'Cập nhật đơn hàng #{orderId}',
      messageTemplate: 'Đơn hàng của bạn đã được cập nhật trạng thái: {status}',
      isActive: true,
    },
    {
      type: NotificationTemplateType.PAYMENT_SUCCESS,
      titleTemplate: 'Thanh toán thành công',
      messageTemplate: 'Thanh toán cho đơn hàng #{orderId} đã thành công',
      isActive: true,
    },
    {
      type: NotificationTemplateType.PRODUCT_LOW_STOCK,
      titleTemplate: 'Sản phẩm sắp hết hàng',
      messageTemplate: 'Sản phẩm {productName} trong wishlist sắp hết hàng',
      isActive: true,
    },
    {
      type: NotificationTemplateType.PROMOTION,
      titleTemplate: 'Khuyến mãi mới',
      messageTemplate: 'Có khuyến mãi mới dành cho bạn!',
      isActive: true,
    },
  ];

  for (const templateData of templates) {
    const template = templateRepository.create(templateData);
    await templateRepository.save(template);
    console.log(`✅ Created template: ${templateData.type}`);
  }

  console.log('🎉 Notification templates seeded successfully!');
}
