import { AppDataSource } from '../../config/database';
import { RefreshToken } from '../entities';

export class RefreshTokenRepository {
  private readonly repository = AppDataSource.getRepository(RefreshToken);

  public async createToken(input: {
    userId: string;
    token: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    const entity = this.repository.create({ ...input, revokedAt: null });
    return this.repository.save(entity);
  }

  public findByToken(token: string): Promise<RefreshToken | null> {
    return this.repository.findOne({ where: { token } });
  }

  public async revokeToken(id: string): Promise<void> {
    await this.repository.update({ id }, { revokedAt: new Date() });
  }

  public async revokeAllForUser(userId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('userId = :userId', { userId })
      .andWhere('revokedAt IS NULL')
      .execute();
  }
}
