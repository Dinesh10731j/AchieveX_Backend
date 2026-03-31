import { AppError, ForbiddenError, NotFoundError } from '../../common/errors';
import { normalizePagination } from '../../common/utils/pagination';
import { GoalVisibility, NotificationType, UserRole } from '../../database/entities';
import { CommentRepository, ManifestationRepository } from '../../database/repositories';
import { ManifestationService } from '../manifestation/manifestation.service';
import { NotificationService } from '../notification/notification.service';
import { CreateCommentDto } from './comment.dto';

export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly manifestationRepository: ManifestationRepository,
    private readonly manifestationService: ManifestationService,
    private readonly notificationService: NotificationService
  ) {}

  public async create(userId: string, dto: CreateCommentDto): Promise<unknown> {
    const manifestation = await this.manifestationRepository.findById(dto.manifestationId);
    if (!manifestation) {
      throw new NotFoundError('Manifestation not found');
    }

    if (manifestation.visibility === GoalVisibility.PRIVATE && manifestation.userId !== userId) {
      throw new ForbiddenError('Cannot comment on private manifestation');
    }

    if (dto.parentCommentId) {
      const parent = await this.commentRepository.findById(dto.parentCommentId);
      if (!parent || parent.manifestationId !== dto.manifestationId) {
        throw new AppError('Parent comment is invalid', 400);
      }
    }

    const comment = this.commentRepository.create({
      userId,
      manifestationId: dto.manifestationId,
      parentCommentId: dto.parentCommentId ?? null,
      content: dto.content,
      isDeleted: false
    });

    const saved = await this.commentRepository.save(comment);
    await this.manifestationService.recomputeConfidence(dto.manifestationId);

    if (manifestation.userId !== userId) {
      await this.notificationService.notify({
        userId: manifestation.userId,
        type: NotificationType.COMMENT,
        title: 'New comment',
        message: 'Someone commented on your manifestation.',
        data: {
          manifestationId: dto.manifestationId,
          commentId: saved.id
        }
      });
    }

    return saved;
  }

  public async list(manifestationId: string, page?: number, limit?: number): Promise<unknown> {
    const pagination = normalizePagination({ page, limit });
    const [rows, total] = await this.commentRepository.listByManifestation(
      manifestationId,
      pagination.page,
      pagination.limit
    );

    return {
      data: rows.map((comment) => ({
        id: comment.id,
        manifestationId: comment.manifestationId,
        userId: comment.userId,
        username: comment.user?.username,
        parentCommentId: comment.parentCommentId,
        content: comment.isDeleted ? '[deleted]' : comment.content,
        isDeleted: comment.isDeleted,
        createdAt: comment.createdAt,
        replies: comment.replies?.map((reply) => ({
          id: reply.id,
          userId: reply.userId,
          content: reply.isDeleted ? '[deleted]' : reply.content,
          createdAt: reply.createdAt
        }))
      })),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total
      }
    };
  }

  public async softDelete(commentId: string, userId: string, role: UserRole): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    const isOwner = comment.userId === userId;
    const isAdmin = role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('You cannot delete this comment');
    }

    comment.isDeleted = true;
    comment.content = '[deleted]';
    await this.commentRepository.save(comment);
  }
}
