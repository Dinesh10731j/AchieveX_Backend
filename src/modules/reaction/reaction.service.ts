import { AppError, ForbiddenError, NotFoundError } from '../../common/errors';
import { GoalVisibility, NotificationType } from '../../database/entities';
import { ManifestationRepository, ReactionRepository } from '../../database/repositories';
import { ManifestationService } from '../manifestation/manifestation.service';
import { NotificationService } from '../notification/notification.service';
import { CreateReactionDto } from './reaction.dto';

export class ReactionService {
  constructor(
    private readonly reactionRepository: ReactionRepository,
    private readonly manifestationRepository: ManifestationRepository,
    private readonly manifestationService: ManifestationService,
    private readonly notificationService: NotificationService
  ) {}

  public async create(userId: string, dto: CreateReactionDto): Promise<unknown> {
    const manifestation = await this.manifestationRepository.findById(dto.manifestationId);
    if (!manifestation) {
      throw new NotFoundError('Manifestation not found');
    }

    if (manifestation.visibility === GoalVisibility.PRIVATE && manifestation.userId !== userId) {
      throw new ForbiddenError('Cannot react to private manifestation');
    }

    const existing = await this.reactionRepository.findByUserManifestationType(
      userId,
      dto.manifestationId,
      dto.type
    );

    if (existing) {
      throw new AppError('Duplicate reaction', 409);
    }

    const reaction = this.reactionRepository.create({
      userId,
      manifestationId: dto.manifestationId,
      type: dto.type
    });

    const saved = await this.reactionRepository.save(reaction);
    await this.manifestationService.recomputeConfidence(dto.manifestationId);

    if (manifestation.userId !== userId) {
      await this.notificationService.notify({
        userId: manifestation.userId,
        type: NotificationType.REACTION,
        title: 'New reaction',
        message: 'Someone reacted to your manifestation.',
        data: {
          manifestationId: dto.manifestationId,
          reactionId: saved.id,
          type: dto.type
        }
      });
    }

    return saved;
  }

  public async remove(userId: string, dto: CreateReactionDto): Promise<void> {
    const existing = await this.reactionRepository.findByUserManifestationType(
      userId,
      dto.manifestationId,
      dto.type
    );

    if (!existing) {
      return;
    }

    await this.reactionRepository.delete(existing.id);
    await this.manifestationService.recomputeConfidence(dto.manifestationId);
  }
}
