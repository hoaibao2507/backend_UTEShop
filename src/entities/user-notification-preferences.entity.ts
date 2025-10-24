import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/users.entity';

@Entity('user_notification_preferences')
export class UserNotificationPreferences {
  @PrimaryColumn()
  userId: number;

  @Column({ default: true })
  orderUpdates: boolean;

  @Column({ default: true })
  paymentNotifications: boolean;

  @Column({ default: true })
  productAlerts: boolean;

  @Column({ default: true })
  promotions: boolean;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
