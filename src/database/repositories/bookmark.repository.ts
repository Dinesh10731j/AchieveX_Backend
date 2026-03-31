import { AppDataSource } from '../../config/database';
import { Bookmark } from '../entities';

export class BookmarkRepository {
  private readonly repository = AppDataSource.getRepository(Bookmark);

  public create(input: Partial<Bookmark>): Bookmark {
    return this.repository.create(input);
  }

  public save(entity: Bookmark): Promise<Bookmark> {
    return this.repository.save(entity);
  }

  public findExisting(userId: string, manifestationId: string): Promise<Bookmark | null> {
    return this.repository.findOne({ where: { userId, manifestationId } });
  }

  public async remove(userId: string, manifestationId: string): Promise<void> {
    await this.repository.delete({ userId, manifestationId });
  }

  public listByUser(userId: string): Promise<Bookmark[]> {
    return this.repository.find({
      where: { userId },
      relations: { manifestation: true }
    });
  }
}
