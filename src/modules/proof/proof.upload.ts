import multer from 'multer';
import { env } from '../../config/env';

export const proofUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadSizeMb * 1024 * 1024
  }
});
