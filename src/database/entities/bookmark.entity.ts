import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column
} from 'typeorm';
import { User } from './user.entity';
import { Manifestation } from './manifestation.entity';

@Entity({ name: 'bookmarks' })
@Index(['userId', 'manifestationId'], { unique: true })
@Index(['userId'])
@Index(['manifestationId'])
export class Bookmark {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  manifestationId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.bookmarks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Manifestation, (manifestation) => manifestation.bookmarks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'manifestationId' })
  manifestation!: Manifestation;
}
