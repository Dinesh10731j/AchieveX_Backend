import { Router } from 'express';
import { authMiddleware, createRateLimiter, validateDto } from '../../common/middleware';
import { ProofController } from './proof.controller';
import { CreateProofDto } from './proof.dto';
import { proofUpload } from './proof.upload';

export const buildProofRouter = (controller: ProofController): Router => {
  const router = Router();

  router.post(
    '/',
    authMiddleware,
    createRateLimiter({ keyPrefix: 'proof-submit', windowSeconds: 60, maxRequests: 20 }),
    proofUpload.single('file'),
    validateDto(CreateProofDto),
    controller.submit
  );

  return router;
};
