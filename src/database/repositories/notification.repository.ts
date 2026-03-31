import { AppDataSource } from '../../config/database';
import { Notification, NotificationType } from '../entities';

export class NotificationRepository {
  private readonly repository = AppDataSource.getRepository(Notification);

  public create(input: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Notification {
    return this.repository.create({
      ...input,
      data: input.data ?? null,
      isRead: false
    });
  }

  public save(entity: Notification): Promise<Notification> {
    return this.repository.save(entity);
  }

  public listByUser(userId: string, page: number, limit: number): Promise<[Notification[], number]> {
    return this.repository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit
    });
  }

  public async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.repository.update({ id: notificationId, userId }, { isRead: true });
  }
}
