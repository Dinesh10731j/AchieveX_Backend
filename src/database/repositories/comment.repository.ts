import { AppDataSource } from '../../config/database';
import { Comment } from '../entities';

export class CommentRepository {
  private readonly repository = AppDataSource.getRepository(Comment);

  public create(input: Partial<Comment>): Comment {
    return this.repository.create(input);
  }

  public save(entity: Comment): Promise<Comment> {
    return this.repository.save(entity);
  }

  public findById(id: string): Promise<Comment | null> {
    return this.repository.findOne({ where: { id } });
  }

  public listByManifestation(manifestationId: string, page: number, limit: number): Promise<[Comment[], number]> {
    return this.repository.findAndCount({
      where: { manifestationId },
      relations: {
        user: true,
        replies: true
      },
      order: {
        createdAt: 'DESC'
      },
      take: limit,
      skip: (page - 1) * limit
    });
  }
}
