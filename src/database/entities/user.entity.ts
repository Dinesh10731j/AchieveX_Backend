import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { UserRole } from './enums';
import { RefreshToken } from './refresh-token.entity';
import { Manifestation } from './manifestation.entity';
import { Proof } from './proof.entity';
import { Comment } from './comment.entity';
import { Reaction } from './reaction.entity';
import { Notification } from './notification.entity';
import { Follow } from './follow.entity';
import { Bookmark } from './bookmark.entity';
import { NotificationPreference } from './notification-preference.entity';

@Entity({ name: 'users' })
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  email!: string;

  @Column({ type: 'varchar', length: 50 })
  username!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  passwordResetTokenHash!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetExpiresAt!: Date | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  streakCount!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastAchievedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => Manifestation, (manifestation) => manifestation.user)
  manifestations!: Manifestation[];

  @OneToMany(() => Proof, (proof) => proof.user)
  proofs!: Proof[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments!: Comment[];

  @OneToMany(() => Reaction, (reaction) => reaction.user)
  reactions!: Reaction[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];

  @OneToMany(() => Follow, (follow) => follow.follower)
  following!: Follow[];

  @OneToMany(() => Follow, (follow) => follow.following)
  followers!: Follow[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  bookmarks!: Bookmark[];

  @OneToOne(() => NotificationPreference, (preference) => preference.user)
  notificationPreference!: NotificationPreference;
}
