import { DataSource } from 'typeorm';
import { UserNotificationPreferences } from '../entities/user-notification-preferences.entity';
import { User } from '../users/users.entity';

export async function seedUserNotificationPreferences(dataSource: DataSource) {
  console.log('🌱 Seeding user notification preferences...');

  const preferencesRepository = dataSource.getRepository(UserNotificationPreferences);
  const userRepository = dataSource.getRepository(User);

  // Check if preferences already exist
  const existingPreferences = await preferencesRepository.count();
  if (existingPreferences > 0) {
    console.log('📋 User notification preferences already exist, skipping...');
    return;
  }

  // Get all users
  const users = await userRepository.find();
  
  if (users.length === 0) {
    console.log('⚠️ No users found, skipping notification preferences seeding...');
    return;
  }

  // Create default preferences for all users
  for (const user of users) {
    const preferences = preferencesRepository.create({
      userId: user.id,
      orderUpdates: true,
      paymentNotifications: true,
      productAlerts: true,
      promotions: true,
    });

    await preferencesRepository.save(preferences);
    console.log(`✅ Created preferences for user: ${user.email}`);
  }

  console.log('🎉 User notification preferences seeded successfully!');
}
