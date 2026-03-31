import { Router } from 'express';
import { authMiddleware, validateDto, validateParamsDto } from '../../common/middleware';
import { IdParamDto } from '../../common/utils';
import { NotificationController } from './notification.controller';
import { UpdateNotificationPreferenceDto } from './notification.dto';

export const buildNotificationRouter = (controller: NotificationController): Router => {
  const router = Router();

  router.use(authMiddleware);
  router.get('/', controller.list);
  router.patch('/:id/read', validateParamsDto(IdParamDto), controller.markRead);
  router.get('/preferences/me', controller.getPreferences);
  router.patch('/preferences/me', validateDto(UpdateNotificationPreferenceDto), controller.updatePreferences);

  return router;
};
