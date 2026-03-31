import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { GoalVisibility, ManifestationStatus } from './enums';
import { User } from './user.entity';
import { Proof } from './proof.entity';
import { Comment } from './comment.entity';
import { Reaction } from './reaction.entity';
import { Bookmark } from './bookmark.entity';

@Entity({ name: 'manifestations' })
@Index(['userId'])
@Index(['deadline'])
@Index(['status'])
@Index(['userId', 'status'])
@Index(['visibility', 'category'])
export class Manifestation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 80 })
  category!: string;

  @Column({ type: 'enum', enum: GoalVisibility, default: GoalVisibility.PUBLIC })
  visibility!: GoalVisibility;

  @Column({ type: 'enum', enum: ManifestationStatus, default: ManifestationStatus.PENDING })
  status!: ManifestationStatus;

  @Column({ type: 'timestamptz' })
  deadline!: Date;

  @Column({ type: 'float', default: 0 })
  confidenceScore!: number;

  @Column({ type: 'timestamptz', nullable: true })
  achievedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  failedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.manifestations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => Proof, (proof) => proof.manifestation)
  proofs!: Proof[];

  @OneToMany(() => Comment, (comment) => comment.manifestation)
  comments!: Comment[];

  @OneToMany(() => Reaction, (reaction) => reaction.manifestation)
  reactions!: Reaction[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.manifestation)
  bookmarks!: Bookmark[];
}
