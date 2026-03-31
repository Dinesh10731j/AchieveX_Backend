import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'notification_preferences' })
@Index(['userId'], { unique: true })
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'boolean', default: true })
  goalReminder!: boolean;

  @Column({ type: 'boolean', default: true })
  goalAchieved!: boolean;

  @Column({ type: 'boolean', default: true })
  comments!: boolean;

  @Column({ type: 'boolean', default: true })
  reactions!: boolean;

  @Column({ type: 'boolean', default: true })
  follows!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => User, (user) => user.notificationPreference, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
