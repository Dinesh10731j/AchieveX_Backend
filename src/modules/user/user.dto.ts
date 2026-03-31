import { IsUUID } from 'class-validator';

export class BookmarkManifestationDto {
  @IsUUID('4')
  manifestationId!: string;
}

export class FollowUserDto {
  @IsUUID('4')
  userId!: string;
}
