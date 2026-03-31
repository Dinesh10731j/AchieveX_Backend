import { Router } from 'express';
import { authMiddleware, createRateLimiter, validateDto } from '../../common/middleware';
import { ReactionController } from './reaction.controller';
import { CreateReactionDto } from './reaction.dto';

export const buildReactionRouter = (controller: ReactionController): Router => {
  const router = Router();

  router.post(
    '/',
    authMiddleware,
    createRateLimiter({ keyPrefix: 'reaction-create', windowSeconds: 60, maxRequests: 60 }),
    validateDto(CreateReactionDto),
    controller.create
  );

  router.delete('/', authMiddleware, validateDto(CreateReactionDto), controller.remove);

  return router;
};
