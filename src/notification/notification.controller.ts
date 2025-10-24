import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { NotificationService, GetNotificationsOptions } from './notification.service';
import { CreateNotificationDto, GetNotificationsDto, BulkCreateNotificationDto } from './dto/notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @Request() req: any,
    @Query() query: GetNotificationsDto,
  ) {
    const userId = req.user.id;
    const options: GetNotificationsOptions = {
      page: query.page,
      limit: query.limit,
      filter: query.filter,
    };

    return await this.notificationService.getUserNotifications(userId, options);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user.id;
    const unreadCount = await this.notificationService.getUnreadCount(userId);
    return { unreadCount };
  }

  @Put(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) notificationId: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    await this.notificationService.markAsRead(notificationId, userId);
    return { message: 'Notification marked as read' };
  }

  @Put('mark-all-read')
  async markAllAsRead(@Request() req: any) {
    const userId = req.user.id;
    await this.notificationService.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  async deleteNotification(
    @Param('id', ParseIntPipe) notificationId: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    await this.notificationService.deleteNotification(notificationId, userId);
    return { message: 'Notification deleted' };
  }

  @Post()
  async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return await this.notificationService.createNotification(createNotificationDto);
  }

  @Post('bulk')
  async bulkCreateNotifications(@Body() bulkCreateDto: BulkCreateNotificationDto) {
    await this.notificationService.bulkCreateNotifications(bulkCreateDto);
    return { message: 'Bulk notifications created successfully' };
  }
}
