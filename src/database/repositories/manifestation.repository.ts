import { FindOptionsWhere, ILike } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { GoalVisibility, Manifestation, ManifestationStatus } from '../entities';

export interface ManifestationFilters {
  category?: string;
  status?: ManifestationStatus;
  visibility?: GoalVisibility;
  search?: string;
  userId?: string;
}

export class ManifestationRepository {
  private readonly repository = AppDataSource.getRepository(Manifestation);

  public create(input: Partial<Manifestation>): Manifestation {
    return this.repository.create(input);
  }

  public save(entity: Manifestation): Promise<Manifestation> {
    return this.repository.save(entity);
  }

  public findById(id: string): Promise<Manifestation | null> {
    return this.repository.findOne({
      where: { id },
      relations: {
        user: true,
        proofs: true,
        comments: true,
        reactions: true
      }
    });
  }

  public async list(filters: ManifestationFilters, page: number, limit: number): Promise<[Manifestation[], number]> {
    const where: FindOptionsWhere<Manifestation> = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.visibility) {
      where.visibility = filters.visibility;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.search) {
      where.title = ILike(`%${filters.search}%`);
    }

    return this.repository.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: {
        confidenceScore: 'DESC',
        createdAt: 'DESC'
      },
      relations: {
        user: true
      }
    });
  }

  public async getTrending(limit: number): Promise<Manifestation[]> {
    return this.repository
      .createQueryBuilder('manifestation')
      .leftJoinAndSelect('manifestation.user', 'user')
      .leftJoin('manifestation.comments', 'comment')
      .leftJoin('manifestation.reactions', 'reaction')
      .where('manifestation.visibility = :visibility', { visibility: GoalVisibility.PUBLIC })
      .andWhere('manifestation.status = :status', { status: ManifestationStatus.PENDING })
      .addSelect('COUNT(DISTINCT comment.id)', 'commentCount')
      .addSelect('COUNT(DISTINCT reaction.id)', 'reactionCount')
      .groupBy('manifestation.id')
      .addGroupBy('user.id')
      .orderBy('manifestation.confidenceScore', 'DESC')
      .addOrderBy('reactionCount', 'DESC')
      .addOrderBy('commentCount', 'DESC')
      .limit(limit)
      .getMany();
  }

  public countByUserAndStatus(userId: string, status: ManifestationStatus): Promise<number> {
    return this.repository.count({ where: { userId, status } });
  }
}
