import { AppError, ForbiddenError, NotFoundError } from '../../common/errors';
import { uploadProofToCloudinary } from '../../common/utils/cloudinary-upload';
import { ManifestationStatus, ProofType } from '../../database/entities';
import { ManifestationRepository, ProofRepository } from '../../database/repositories';
import { ManifestationService } from '../manifestation/manifestation.service';
import { CreateProofDto } from './proof.dto';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

export class ProofService {
  constructor(
    private readonly proofRepository: ProofRepository,
    private readonly manifestationRepository: ManifestationRepository,
    private readonly manifestationService: ManifestationService
  ) {}

  public async submitProof(
    userId: string,
    dto: CreateProofDto,
    file?: Express.Multer.File
  ): Promise<unknown> {
    const manifestation = await this.manifestationRepository.findById(dto.manifestationId);
    if (!manifestation) {
      throw new NotFoundError('Manifestation not found');
    }

    if (manifestation.userId !== userId) {
      throw new ForbiddenError('You can only submit proof for your own manifestation');
    }

    if (manifestation.status !== ManifestationStatus.PENDING) {
      throw new AppError('Proof upload is allowed only while manifestation is pending.', 400);
    }

    if (manifestation.deadline.getTime() <= Date.now()) {
      throw new AppError('You can upload proof only before deadline.', 400);
    }

    const existingProof = await this.proofRepository.findByManifestationId(dto.manifestationId);
    if (existingProof) {
      throw new AppError('Proof already submitted for this manifestation', 409);
    }

    if (dto.type === ProofType.TEXT) {
      if (!dto.textContent) {
        throw new AppError('Text proof requires textContent', 400);
      }
    } else {
      if (!file) {
        throw new AppError('File upload is required for image/video proof', 400);
      }

      if (dto.type === ProofType.IMAGE && !ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
        throw new AppError('Invalid image format', 400);
      }

      if (dto.type === ProofType.VIDEO && !ALLOWED_VIDEO_TYPES.has(file.mimetype)) {
        throw new AppError('Invalid video format', 400);
      }
    }

    let contentUrl: string | null = null;
    let mimeType: string | null = null;

    if (file && dto.type !== ProofType.TEXT) {
      const uploaded = await uploadProofToCloudinary(file, dto.type);
      contentUrl = uploaded.secureUrl;
      mimeType = uploaded.mimeType;
    }

    const proof = this.proofRepository.create({
      userId,
      manifestationId: dto.manifestationId,
      type: dto.type,
      contentUrl,
      mimeType,
      textContent: dto.type === ProofType.TEXT ? dto.textContent ?? null : null
    });

    const saved = await this.proofRepository.save(proof);

    manifestation.status = ManifestationStatus.ACHIEVED;
    manifestation.achievedAt = new Date();
    await this.manifestationRepository.save(manifestation);

    await this.manifestationService.recomputeConfidence(dto.manifestationId);
    return saved;
  }
}
