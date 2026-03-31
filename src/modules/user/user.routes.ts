import { Router } from 'express';
import { authMiddleware, createRateLimiter, validateParamsDto } from '../../common/middleware';
import { IdParamDto, ManifestationIdParamDto } from '../../common/utils';
import { UserController } from './user.controller';

export const buildUserRouter = (controller: UserController): Router => {
  const router = Router();

  router.use(authMiddleware);

  router.get('/me', controller.getMe);

  router.post(
    '/:id/follow',
    validateParamsDto(IdParamDto),
    createRateLimiter({ keyPrefix: 'follow', windowSeconds: 60, maxRequests: 20 }),
    controller.followUser
  );
  router.delete('/:id/follow', validateParamsDto(IdParamDto), controller.unfollowUser);

  router.get('/:id/followers', validateParamsDto(IdParamDto), controller.listFollowers);
  router.get('/:id/following', validateParamsDto(IdParamDto), controller.listFollowing);

  router.post(
    '/bookmarks/:manifestationId',
    validateParamsDto(ManifestationIdParamDto),
    controller.bookmark
  );
  router.delete(
    '/bookmarks/:manifestationId',
    validateParamsDto(ManifestationIdParamDto),
    controller.removeBookmark
  );
  router.get('/bookmarks/me', controller.listBookmarks);

  return router;
};
