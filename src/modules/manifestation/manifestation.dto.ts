import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { GoalVisibility, ManifestationStatus } from '../../database/entities';

export class CreateManifestationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @IsDateString()
  deadline!: string;

  @IsEnum(GoalVisibility)
  visibility!: GoalVisibility;

  @IsString()
  @MaxLength(80)
  category!: string;
}

export class ListManifestationQueryDto {
  @IsOptional()
  @IsEnum(ManifestationStatus)
  status?: ManifestationStatus;

  @IsOptional()
  @IsEnum(GoalVisibility)
  visibility?: GoalVisibility;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  @IsString()
  userId?: string;
}
