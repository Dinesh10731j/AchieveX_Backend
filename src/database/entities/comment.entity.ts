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
import { User } from './user.entity';
import { Manifestation } from './manifestation.entity';

@Entity({ name: 'comments' })
@Index(['manifestationId'])
@Index(['userId'])
@Index(['parentCommentId'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  manifestationId!: string;

  @Column({ type: 'uuid', nullable: true })
  parentCommentId!: string | null;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Manifestation, (manifestation) => manifestation.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'manifestationId' })
  manifestation!: Manifestation;

  @ManyToOne(() => Comment, (comment) => comment.replies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentCommentId' })
  parentComment!: Comment | null;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  replies!: Comment[];
}
