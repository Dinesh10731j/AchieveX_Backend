import streamifier from 'streamifier';
import { ProofType } from '../../database/entities';
import { cloudinary, isCloudinaryConfigured } from '../../config/cloudinary';
import { env } from '../../config/env';
import { AppError } from '../errors';

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  mimeType: string;
}

export const uploadProofToCloudinary = async (
  file: Express.Multer.File,
  proofType: ProofType
): Promise<CloudinaryUploadResult> => {
  if (!isCloudinaryConfigured) {
    throw new AppError('Cloudinary is not configured. Set CLOUDINARY_* environment variables.', 500);
  }

  const resourceType = proofType === ProofType.VIDEO ? 'video' : 'image';

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: env.cloudinaryFolder,
        resource_type: resourceType,
        overwrite: false
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError('Cloudinary upload failed', 500, error));
          return;
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          mimeType: file.mimetype
        });
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};
