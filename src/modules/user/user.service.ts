import { AppError, NotFoundError } from '../../common/errors';
import {
  BookmarkRepository,
  FollowRepository,
  ManifestationRepository,
  UserRepository
} from '../../database/repositories';
import { ManifestationStatus, NotificationType } from '../../database/entities';
import { NotificationService } from '../notification/notification.service';

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly followRepository: FollowRepository,
    private readonly bookmarkRepository: BookmarkRepository,
    private readonly manifestationRepository: ManifestationRepository,
    private readonly notificationService: NotificationService
  ) {}

  public async getMe(userId: string): Promise<unknown> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const [followers, following, achieved] = await Promise.all([
      this.followRepository.listFollowers(userId),
      this.followRepository.listFollowing(userId),
      this.manifestationRepository.countByUserAndStatus(userId, ManifestationStatus.ACHIEVED)
    ]);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      streakCount: user.streakCount,
      achievedCount: achieved,
      followersCount: followers.length,
      followingCount: following.length,
      createdAt: user.createdAt
    };
  }

  public async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new AppError('You cannot follow yourself', 400);
    }

    const target = await this.userRepository.findById(followingId);
    if (!target) {
      throw new NotFoundError('Target user not found');
    }

    const existing = await this.followRepository.findExisting(followerId, followingId);
    if (existing) {
      return;
    }

    await this.followRepository.save(
      this.followRepository.create({
        followerId,
        followingId
      })
    );

    await this.notificationService.notify({
      userId: followingId,
      type: NotificationType.FOLLOW,
      title: 'New follower',
      message: 'Someone started following your journey.',
      data: { followerId }
    });
  }

  public async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await this.followRepository.remove(followerId, followingId);
  }

  public async listFollowers(userId: string): Promise<unknown[]> {
    const rows = await this.followRepository.listFollowers(userId);
    return rows.map((row) => ({
      id: row.follower.id,
      username: row.follower.username,
      createdAt: row.createdAt
    }));
  }

  public async listFollowing(userId: string): Promise<unknown[]> {
    const rows = await this.followRepository.listFollowing(userId);
    return rows.map((row) => ({
      id: row.following.id,
      username: row.following.username,
      createdAt: row.createdAt
    }));
  }

  public async bookmark(userId: string, manifestationId: string): Promise<void> {
    const manifestation = await this.manifestationRepository.findById(manifestationId);
    if (!manifestation) {
      throw new NotFoundError('Manifestation not found');
    }

    const existing = await this.bookmarkRepository.findExisting(userId, manifestationId);
    if (existing) {
      return;
    }

    await this.bookmarkRepository.save(
      this.bookmarkRepository.create({
        userId,
        manifestationId
      })
    );
  }

  public async removeBookmark(userId: string, manifestationId: string): Promise<void> {
    await this.bookmarkRepository.remove(userId, manifestationId);
  }

  public async listBookmarks(userId: string): Promise<unknown[]> {
    const bookmarks = await this.bookmarkRepository.listByUser(userId);

    return bookmarks.map((bookmark) => ({
      id: bookmark.id,
      createdAt: bookmark.createdAt,
      manifestation: {
        id: bookmark.manifestation.id,
        title: bookmark.manifestation.title,
        status: bookmark.manifestation.status,
        deadline: bookmark.manifestation.deadline
      }
    }));
  }
}
