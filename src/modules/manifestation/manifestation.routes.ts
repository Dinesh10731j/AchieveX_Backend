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
import { CreateManifestationDto, ListManifestationQueryDto } from './manifestation.dto';
import { ManifestationController } from './manifestation.controller';

export const buildManifestationRouter = (controller: ManifestationController): Router => {
  const router = Router();

  router.get('/', optionalAuthMiddleware, validateQueryDto(ListManifestationQueryDto), controller.list);
  router.get('/trending', optionalAuthMiddleware, controller.trending);
  router.get('/:id', optionalAuthMiddleware, validateParamsDto(IdParamDto), controller.getById);

  router.post(
    '/',
    authMiddleware,
    createRateLimiter({ keyPrefix: 'manifestation-create', windowSeconds: 60, maxRequests: 10 }),
    validateDto(CreateManifestationDto),
    controller.create
  );

  return router;
};
