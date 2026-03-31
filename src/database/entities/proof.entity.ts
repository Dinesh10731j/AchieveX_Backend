import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { ProofType } from './enums';
import { User } from './user.entity';
import { Manifestation } from './manifestation.entity';

@Entity({ name: 'proofs' })
@Index(['userId'])
@Index(['manifestationId'])
@Index(['manifestationId'], { unique: true })
export class Proof {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  manifestationId!: string;

  @Column({ type: 'enum', enum: ProofType })
  type!: ProofType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contentUrl!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  mimeType!: string | null;

  @Column({ type: 'text', nullable: true })
  textContent!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.proofs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Manifestation, (manifestation) => manifestation.proofs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'manifestationId' })
  manifestation!: Manifestation;
}
