import { AppDataSource } from '../../config/database';
import { Reaction, ReactionType } from '../entities';

export class ReactionRepository {
  private readonly repository = AppDataSource.getRepository(Reaction);

  public create(input: Partial<Reaction>): Reaction {
    return this.repository.create(input);
  }

  public save(entity: Reaction): Promise<Reaction> {
    return this.repository.save(entity);
  }

  public findByUserManifestationType(
    userId: string,
    manifestationId: string,
    type: ReactionType
  ): Promise<Reaction | null> {
    return this.repository.findOne({ where: { userId, manifestationId, type } });
  }

  public countForManifestation(manifestationId: string): Promise<number> {
    return this.repository.count({ where: { manifestationId } });
  }

  public async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
