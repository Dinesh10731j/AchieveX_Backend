import { AppDataSource } from '../../config/database';
import { NotificationPreference } from '../entities';

export class NotificationPreferenceRepository {
  private readonly repository = AppDataSource.getRepository(NotificationPreference);

  public findByUserId(userId: string): Promise<NotificationPreference | null> {
    return this.repository.findOne({ where: { userId } });
  }

  public async ensureDefault(userId: string): Promise<NotificationPreference> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      return existing;
    }

    const entity = this.repository.create({ userId });
    return this.repository.save(entity);
  }

  public async updatePreferences(
    userId: string,
    input: Partial<Omit<NotificationPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'user'>>
  ): Promise<NotificationPreference> {
    const preference = await this.ensureDefault(userId);
    Object.assign(preference, input);
    return this.repository.save(preference);
  }
}
