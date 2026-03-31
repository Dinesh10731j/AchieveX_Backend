import 'reflect-metadata';
import 'express-async-errors';
import path from 'path';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import { AppContainer } from './container';
import { env } from './config/env';
import {
  errorHandler,
  requestLogger,
  sanitizeInputMiddleware
} from './common/middleware';
import { buildAuthRouter } from './modules/auth/auth.routes';
import { buildManifestationRouter } from './modules/manifestation/manifestation.routes';
import { buildProofRouter } from './modules/proof/proof.routes';
import { buildCommentRouter } from './modules/comment/comment.routes';
import { buildReactionRouter } from './modules/reaction/reaction.routes';
import { buildNotificationRouter } from './modules/notification/notification.routes';
import { buildUserRouter } from './modules/user/user.routes';

export const createApp = (container: AppContainer): Express => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);
  app.use(sanitizeInputMiddleware);

  app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  const router = express.Router();
  router.use('/auth', buildAuthRouter(container.controllers.authController));
  router.use('/manifestations', buildManifestationRouter(container.controllers.manifestationController));
  router.use('/proofs', buildProofRouter(container.controllers.proofController));
  router.use('/comments', buildCommentRouter(container.controllers.commentController));
  router.use('/reactions', buildReactionRouter(container.controllers.reactionController));
  router.use('/notifications', buildNotificationRouter(container.controllers.notificationController));
  router.use('/users', buildUserRouter(container.controllers.userController));

  app.use(env.apiPrefix, router);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: 'Route not found' });
  });

  app.use(errorHandler);

  return app;
};
