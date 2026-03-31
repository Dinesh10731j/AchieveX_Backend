import { IsEnum, IsUUID } from 'class-validator';
import { ReactionType } from '../../database/entities';

export class CreateReactionDto {
  @IsUUID('4')
  manifestationId!: string;

  @IsEnum(ReactionType)
  type!: ReactionType;
}
