import { Router } from 'express';
import {
  authMiddleware,
  createRateLimiter,
  optionalAuthMiddleware,
  validateDto,
  validateParamsDto,
  validateQueryDto
} from '../../common/middleware';
import { IdParamDto } from '../../common/utils';
import { CommentController } from './comment.controller';
import { CreateCommentDto, ListCommentsQueryDto } from './comment.dto';

export const buildCommentRouter = (controller: CommentController): Router => {
  const router = Router();

  router.get('/', optionalAuthMiddleware, validateQueryDto(ListCommentsQueryDto), controller.list);

  router.post(
    '/',
    authMiddleware,
    createRateLimiter({ keyPrefix: 'comment-create', windowSeconds: 60, maxRequests: 30 }),
    validateDto(CreateCommentDto),
    controller.create
  );

  router.delete('/:id', authMiddleware, validateParamsDto(IdParamDto), controller.softDelete);

  return router;
};
