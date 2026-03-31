import { AppDataSource } from '../../config/database';
import { Follow } from '../entities';

export class FollowRepository {
  private readonly repository = AppDataSource.getRepository(Follow);

  public create(input: Partial<Follow>): Follow {
    return this.repository.create(input);
  }

  public save(entity: Follow): Promise<Follow> {
    return this.repository.save(entity);
  }

  public findExisting(followerId: string, followingId: string): Promise<Follow | null> {
    return this.repository.findOne({ where: { followerId, followingId } });
  }

  public async remove(followerId: string, followingId: string): Promise<void> {
    await this.repository.delete({ followerId, followingId });
  }

  public listFollowers(userId: string): Promise<Follow[]> {
    return this.repository.find({
      where: { followingId: userId },
      relations: { follower: true }
    });
  }

  public listFollowing(userId: string): Promise<Follow[]> {
    return this.repository.find({
      where: { followerId: userId },
      relations: { following: true }
    });
  }
}
