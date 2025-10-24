import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum NotificationTemplateType {
  ORDER_STATUS_UPDATE = 'order_status_update',
  PAYMENT_SUCCESS = 'payment_success',
  PRODUCT_LOW_STOCK = 'product_low_stock',
  PROMOTION = 'promotion',
}

@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: NotificationTemplateType,
  })
  type: NotificationTemplateType;

  @Column({ length: 255 })
  titleTemplate: string;

  @Column({ type: 'text' })
  messageTemplate: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
