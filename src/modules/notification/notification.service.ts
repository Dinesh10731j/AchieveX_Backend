import {
  NotificationPreferenceRepository,
  NotificationRepository
} from '../../database/repositories';
import { NotificationType } from '../../database/entities';
import { emitToUser } from '../../sockets';
import { NotificationEvents } from '../../sockets/events';
import { normalizePagination } from '../../common/utils/pagination';

export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly preferenceRepository: NotificationPreferenceRepository
  ) {}

  private mapTypeToPreference(type: NotificationType): keyof Awaited<
    ReturnType<NotificationPreferenceRepository['ensureDefault']>
  > {
    switch (type) {
      case NotificationType.GOAL_REMINDER:
        return 'goalReminder';
      case NotificationType.GOAL_ACHIEVED:
      case NotificationType.GOAL_FAILED:
        return 'goalAchieved';
      case NotificationType.COMMENT:
        return 'comments';
      case NotificationType.REACTION:
        return 'reactions';
      case NotificationType.FOLLOW:
        return 'follows';
      default:
        return 'goalReminder';
    }
  }

  private mapTypeToEvent(type: NotificationType): string {
    switch (type) {
      case NotificationType.GOAL_REMINDER:
        return NotificationEvents.GOAL_REMINDER;
      case NotificationType.GOAL_ACHIEVED:
        return NotificationEvents.GOAL_ACHIEVED;
      case NotificationType.GOAL_FAILED:
        return NotificationEvents.GOAL_FAILED;
      case NotificationType.COMMENT:
        return NotificationEvents.COMMENT_CREATED;
      case NotificationType.REACTION:
        return NotificationEvents.REACTION_CREATED;
      case NotificationType.FOLLOW:
        return NotificationEvents.FOLLOW_CREATED;
      default:
        return 'notification.created';
    }
  }

  public async notify(input: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    const preference = await this.preferenceRepository.ensureDefault(input.userId);
    const preferenceKey = this.mapTypeToPreference(input.type);

    if (!preference[preferenceKey]) {
      return;
    }

    const notification = this.notificationRepository.create(input);
    const saved = await this.notificationRepository.save(notification);

    emitToUser(input.userId, this.mapTypeToEvent(input.type), saved);
  }

  public async list(userId: string, page?: number, limit?: number): Promise<{
    data: unknown[];
    meta: { page: number; limit: number; total: number };
  }> {
    const pagination = normalizePagination({ page, limit });
    const [data, total] = await this.notificationRepository.listByUser(
      userId,
      pagination.page,
      pagination.limit
    );

    return {
      data,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total
      }
    };
  }

  public async markRead(userId: string, notificationId: string): Promise<void> {
    await this.notificationRepository.markAsRead(userId, notificationId);
  }

  public async getPreferences(userId: string): Promise<unknown> {
    return this.preferenceRepository.ensureDefault(userId);
  }

  public async updatePreferences(
    userId: string,
    input: {
      goalReminder?: boolean;
      goalAchieved?: boolean;
      comments?: boolean;
      reactions?: boolean;
      follows?: boolean;
    }
  ): Promise<unknown> {
    return this.preferenceRepository.updatePreferences(userId, input);
  }
}
