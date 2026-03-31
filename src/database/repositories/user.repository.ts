import { MoreThan } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { User, UserRole } from '../entities';

export class UserRepository {
  private readonly repository = AppDataSource.getRepository(User);

  public findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  public findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email: email.toLowerCase() } });
  }

  public findByUsername(username: string): Promise<User | null> {
    return this.repository.findOne({ where: { username: username.toLowerCase() } });
  }

  public async createUser(input: {
    email: string;
    username: string;
    passwordHash: string;
    role?: UserRole;
  }): Promise<User> {
    const user = this.repository.create({
      email: input.email.toLowerCase(),
      username: input.username.toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role ?? UserRole.USER,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null
    });

    return this.repository.save(user);
  }

  public async setPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<void> {
    await this.repository.update(
      { id: userId },
      {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt
      }
    );
  }

  public findByResetTokenHash(tokenHash: string): Promise<User | null> {
    return this.repository.findOne({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: MoreThan(new Date())
      }
    });
  }

  public async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.repository.update(
      { id: userId },
      {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null
      }
    );
  }

  public async clearPasswordResetToken(userId: string): Promise<void> {
    await this.repository.update(
      { id: userId },
      {
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null
      }
    );
  }

  public async getSuccessRate(userId: string): Promise<number> {
    const [achieved, finalized] = await Promise.all([
      this.repository
        .createQueryBuilder('user')
        .leftJoin('user.manifestations', 'manifestation')
        .where('user.id = :userId', { userId })
        .andWhere('manifestation.status = :status', { status: 'achieved' })
        .getCount(),
      this.repository
        .createQueryBuilder('user')
        .leftJoin('user.manifestations', 'manifestation')
        .where('user.id = :userId', { userId })
        .andWhere('manifestation.status IN (:...statuses)', { statuses: ['achieved', 'failed'] })
        .getCount()
    ]);

    if (finalized === 0) {
      return 0;
    }

    return achieved / finalized;
  }

  public async updateStreak(userId: string, didAchieve: boolean): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      return;
    }

    if (didAchieve) {
      const last = user.lastAchievedAt ? new Date(user.lastAchievedAt) : null;
      const now = new Date();
      const isConsecutive =
        last && Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)) <= 1;

      user.streakCount = isConsecutive ? user.streakCount + 1 : 1;
      user.lastAchievedAt = now;
    } else {
      user.streakCount = 0;
    }

    await this.repository.save(user);
  }
}
