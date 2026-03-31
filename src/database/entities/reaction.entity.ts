import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { ReactionType } from './enums';
import { User } from './user.entity';
import { Manifestation } from './manifestation.entity';

@Entity({ name: 'reactions' })
@Index(['manifestationId'])
@Index(['userId'])
@Index(['userId', 'manifestationId', 'type'], { unique: true })
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  manifestationId!: string;

  @Column({ type: 'enum', enum: ReactionType })
  type!: ReactionType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Manifestation, (manifestation) => manifestation.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'manifestationId' })
  manifestation!: Manifestation;
}
