import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsUUID('4')
  manifestationId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @IsOptional()
  @IsUUID('4')
  parentCommentId?: string;
}

export class ListCommentsQueryDto {
  @IsUUID('4')
  manifestationId!: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
