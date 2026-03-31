import { Container } from './common/utils/container';
import { EmailService } from './common/utils/email.service';
import {
  BookmarkRepository,
  CommentRepository,
  FollowRepository,
  ManifestationRepository,
  NotificationPreferenceRepository,
  NotificationRepository,
  ProofRepository,
  ReactionRepository,
  RefreshTokenRepository,
  UserRepository
} from './database/repositories';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { CommentController } from './modules/comment/comment.controller';
import { CommentService } from './modules/comment/comment.service';
import { ManifestationController } from './modules/manifestation/manifestation.controller';
import { ManifestationService } from './modules/manifestation/manifestation.service';
import { NotificationController } from './modules/notification/notification.controller';
import { NotificationService } from './modules/notification/notification.service';
import { ProofController } from './modules/proof/proof.controller';
import { ProofService } from './modules/proof/proof.service';
import { ReactionController } from './modules/reaction/reaction.controller';
import { ReactionService } from './modules/reaction/reaction.service';
import { UserController } from './modules/user/user.controller';
import { UserService } from './modules/user/user.service';

export interface AppContainer {
  services: {
    authService: AuthService;
    manifestationService: ManifestationService;
    proofService: ProofService;
    commentService: CommentService;
    reactionService: ReactionService;
    notificationService: NotificationService;
    userService: UserService;
    emailService: EmailService;
  };
  controllers: {
    authController: AuthController;
    manifestationController: ManifestationController;
    proofController: ProofController;
    commentController: CommentController;
    reactionController: ReactionController;
    notificationController: NotificationController;
    userController: UserController;
  };
}

export const buildContainer = (): AppContainer => {
  const container = new Container();

  container.register('userRepository', new UserRepository());
  container.register('refreshTokenRepository', new RefreshTokenRepository());
  container.register('manifestationRepository', new ManifestationRepository());
  container.register('proofRepository', new ProofRepository());
  container.register('commentRepository', new CommentRepository());
  container.register('reactionRepository', new ReactionRepository());
  container.register('notificationRepository', new NotificationRepository());
  container.register('followRepository', new FollowRepository());
  container.register('bookmarkRepository', new BookmarkRepository());
  container.register('notificationPreferenceRepository', new NotificationPreferenceRepository());
  container.register('emailService', new EmailService());

  const notificationService = new NotificationService(
    container.resolve<NotificationRepository>('notificationRepository'),
    container.resolve<NotificationPreferenceRepository>('notificationPreferenceRepository')
  );

  const manifestationService = new ManifestationService(
    container.resolve<ManifestationRepository>('manifestationRepository'),
    container.resolve<UserRepository>('userRepository'),
    notificationService,
    container.resolve<EmailService>('emailService')
  );

  const authService = new AuthService(
    container.resolve<UserRepository>('userRepository'),
    container.resolve<RefreshTokenRepository>('refreshTokenRepository'),
    container.resolve<NotificationPreferenceRepository>('notificationPreferenceRepository'),
    container.resolve<EmailService>('emailService')
  );

  const proofService = new ProofService(
    container.resolve<ProofRepository>('proofRepository'),
    container.resolve<ManifestationRepository>('manifestationRepository'),
    manifestationService
  );

  const commentService = new CommentService(
    container.resolve<CommentRepository>('commentRepository'),
    container.resolve<ManifestationRepository>('manifestationRepository'),
    manifestationService,
    notificationService
  );

  const reactionService = new ReactionService(
    container.resolve<ReactionRepository>('reactionRepository'),
    container.resolve<ManifestationRepository>('manifestationRepository'),
    manifestationService,
    notificationService
  );

  const userService = new UserService(
    container.resolve<UserRepository>('userRepository'),
    container.resolve<FollowRepository>('followRepository'),
    container.resolve<BookmarkRepository>('bookmarkRepository'),
    container.resolve<ManifestationRepository>('manifestationRepository'),
    notificationService
  );

  return {
    services: {
      authService,
      manifestationService,
      proofService,
      commentService,
      reactionService,
      notificationService,
      userService,
      emailService: container.resolve<EmailService>('emailService')
    },
    controllers: {
      authController: new AuthController(authService),
      manifestationController: new ManifestationController(manifestationService),
      proofController: new ProofController(proofService),
      commentController: new CommentController(commentService),
      reactionController: new ReactionController(reactionService),
      notificationController: new NotificationController(notificationService),
      userController: new UserController(userService)
    }
  };
};
