import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { UserNotificationPreferences } from '../entities/user-notification-preferences.entity';
import { Notification, NotificationType } from '../entities/notification.entity';
import { User } from '../users/users.entity';

config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'uteshop_db',
  entities: [
    Notification,
    NotificationTemplate,
    UserNotificationPreferences,
    User,
  ],
  synchronize: false,
  logging: false,
});

async function testNotificationSystem() {
  try {
    await AppDataSource.initialize();
    console.log('🔌 Database connected successfully');

    // Test notification templates
    const templateRepository = AppDataSource.getRepository(NotificationTemplate);
    const templates = await templateRepository.find();
    console.log(`📋 Found ${templates.length} notification templates:`, templates.map(t => t.type));

    // Test user notification preferences
    const preferencesRepository = AppDataSource.getRepository(UserNotificationPreferences);
    const preferences = await preferencesRepository.find();
    console.log(`👥 Found ${preferences.length} user notification preferences`);

    // Test notifications
    const notificationRepository = AppDataSource.getRepository(Notification);
    const notifications = await notificationRepository.find();
    console.log(`🔔 Found ${notifications.length} notifications`);

    // Test creating a notification
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({ take: 1 });
    
    if (users.length > 0) {
      const testNotification = notificationRepository.create({
        userId: users[0].id,
        type: NotificationType.INFO,
        title: 'Test Notification',
        message: 'This is a test notification to verify the system works',
        isRead: false,
      });
      
      const savedNotification = await notificationRepository.save(testNotification);
      console.log(`✅ Created test notification with ID: ${savedNotification.id}`);
      
      // Clean up test notification
      await notificationRepository.delete(savedNotification.id);
      console.log(`🗑️ Cleaned up test notification`);
    }

    console.log('🎉 Notification system test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing notification system:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

testNotificationSystem();
