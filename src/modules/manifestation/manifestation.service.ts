import { AppDataSource } from '../../config/database';
import { AppError, ForbiddenError, NotFoundError } from '../../common/errors';
import {
  calculateGoalConfidence,
  calculateTimeFactor,
  normalizeActivityScore
} from '../../common/utils/algorithm';
import { cacheDelete, cacheGetJson, cacheSetJson } from '../../common/utils/cache';
import { normalizePagination } from '../../common/utils/pagination';
import {
  GoalVisibility,
  Manifestation,
  ManifestationStatus,
  NotificationType,
  Proof,
  UserRole
} from '../../database/entities';
import {
  ManifestationFilters,
  ManifestationRepository,
  UserRepository
} from '../../database/repositories';
import { scheduleManifestationJobs } from '../../queues/jobs';
import { EmailService } from '../../common/utils/email.service';
import { NotificationService } from '../notification/notification.service';
import { CreateManifestationDto, ListManifestationQueryDto } from './manifestation.dto';

interface ViewerContext {
  userId?: string;
  role?: UserRole;
}

export class ManifestationService {
  constructor(
    private readonly manifestationRepository: ManifestationRepository,
    private readonly userRepository: UserRepository,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService
  ) {}

  public async create(userId: string, dto: CreateManifestationDto): Promise<Manifestation> {
    const deadline = new Date(dto.deadline);
    if (deadline.getTime() <= Date.now()) {
      throw new AppError('Deadline must be in the future', 400);
    }

    const successRate = await this.userRepository.getSuccessRate(userId);
    const timeFactor = calculateTimeFactor(deadline, new Date());
    const confidenceScore = calculateGoalConfidence({
      successRate,
      activityScore: 0,
      timeFactor
    });

    const entity = this.manifestationRepository.create({
      userId,
      title: dto.title,
      description: dto.description,
      deadline,
      visibility: dto.visibility,
      category: dto.category,
      status: ManifestationStatus.PENDING,
      confidenceScore
    });

    const saved = await this.manifestationRepository.save(entity);
    await scheduleManifestationJobs(saved.id, saved.deadline);
    await cacheDelete('manifestations:trending');

    return saved;
  }

  public async list(query: ListManifestationQueryDto, viewer: ViewerContext): Promise<{
    data: Manifestation[];
    meta: { page: number; limit: number; total: number };
  }> {
    const pagination = normalizePagination({
      page: query.page,
      limit: query.limit
    });

    const filters: ManifestationFilters = {
      category: query.category,
      status: query.status,
      search: query.search,
      userId: query.userId
    };

    const canViewPrivate = viewer.userId && query.userId === viewer.userId;
    filters.visibility = canViewPrivate ? query.visibility : GoalVisibility.PUBLIC;

    const cacheKey = `manifestations:list:${JSON.stringify({ filters, pagination })}`;
    if (!viewer.userId && filters.visibility === GoalVisibility.PUBLIC) {
      const cached = await cacheGetJson<{ data: Manifestation[]; meta: { page: number; limit: number; total: number } }>(
        cacheKey
      );
      if (cached) {
        return cached;
      }
    }

    const [rows, total] = await this.manifestationRepository.list(
      filters,
      pagination.page,
      pagination.limit
    );

    const response = {
      data: rows,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total
      }
    };

    if (!viewer.userId && filters.visibility === GoalVisibility.PUBLIC) {
      await cacheSetJson(cacheKey, response, 60);
    }

    return response;
  }

  public async trending(limit = 10): Promise<Manifestation[]> {
    const cacheKey = 'manifestations:trending';
    const cached = await cacheGetJson<Manifestation[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.manifestationRepository.getTrending(limit);
    await cacheSetJson(cacheKey, data, 60);
    return data;
  }

  public async getById(id: string, viewer: ViewerContext): Promise<Manifestation> {
    const manifestation = await this.manifestationRepository.findById(id);
    if (!manifestation) {
      throw new NotFoundError('Manifestation not found');
    }

    const canView =
      manifestation.visibility === GoalVisibility.PUBLIC ||
      manifestation.userId === viewer.userId ||
      viewer.role === UserRole.ADMIN;

    if (!canView) {
      throw new ForbiddenError('This manifestation is private');
    }

    return manifestation;
  }

  public async recomputeConfidence(manifestationId: string): Promise<void> {
    const manifestation = await this.manifestationRepository.findById(manifestationId);
    if (!manifestation) {
      return;
    }

    const successRate = await this.userRepository.getSuccessRate(manifestation.userId);
    const activityScore = normalizeActivityScore(
      manifestation.comments.length,
      manifestation.reactions.length,
      manifestation.proofs.length > 0
    );

    const timeFactor = calculateTimeFactor(manifestation.deadline, manifestation.createdAt);
    manifestation.confidenceScore = calculateGoalConfidence({
      successRate,
      activityScore,
      timeFactor
    });

    await this.manifestationRepository.save(manifestation);
    await cacheDelete('manifestations:trending');
  }

  public async finalizeByDeadline(manifestationId: string): Promise<'achieved' | 'failed' | 'ignored'> {
    let result: 'achieved' | 'failed' | 'ignored' = 'ignored';
    let ownerId = '';
    let title = '';

    await AppDataSource.transaction(async (manager) => {
      const manifestation = await manager
        .getRepository(Manifestation)
        .createQueryBuilder('manifestation')
        .setLock('pessimistic_write')
        .where('manifestation.id = :id', { id: manifestationId })
        .getOne();

      if (!manifestation) {
        result = 'ignored';
        return;
      }

      if (manifestation.status !== ManifestationStatus.PENDING) {
        result = 'ignored';
        return;
      }

      const proof = await manager
        .getRepository(Proof)
        .createQueryBuilder('proof')
        .where('proof.manifestationId = :manifestationId', { manifestationId })
        .andWhere('proof.createdAt <= :deadline', { deadline: manifestation.deadline })
        .getOne();

      ownerId = manifestation.userId;
      title = manifestation.title;

      if (proof) {
        manifestation.status = ManifestationStatus.ACHIEVED;
        manifestation.achievedAt = new Date();
        result = 'achieved';
      } else {
        manifestation.status = ManifestationStatus.FAILED;
        manifestation.failedAt = new Date();
        result = 'failed';
      }

      await manager.getRepository(Manifestation).save(manifestation);
    });

    if (result === 'ignored') {
      return result;
    }

    const owner = await this.userRepository.findById(ownerId);
    await this.userRepository.updateStreak(ownerId, result === 'achieved');

    if (result === 'achieved') {
      await this.notificationService.notify({
        userId: ownerId,
        type: NotificationType.GOAL_ACHIEVED,
        title: 'Goal achieved',
        message: `Congratulations! "${title}" is marked as achieved.`,
        data: { manifestationId }
      });

      if (owner) {
        await this.emailService.sendGoalProofPromptEmail({
          to: owner.email,
          username: owner.username,
          goalTitle: title
        });
      }
    } else {
      await this.notificationService.notify({
        userId: ownerId,
        type: NotificationType.GOAL_FAILED,
        title: 'Goal failed',
        message: `Your goal "${title}" has been marked as failed due to missing proof before deadline.`,
        data: { manifestationId }
      });
    }

    await cacheDelete('manifestations:trending');
    return result;
  }
}
