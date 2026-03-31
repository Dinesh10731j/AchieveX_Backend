import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferenceDto {
  @IsOptional()
  @IsBoolean()
  goalReminder?: boolean;

  @IsOptional()
  @IsBoolean()
  goalAchieved?: boolean;

  @IsOptional()
  @IsBoolean()
  comments?: boolean;

  @IsOptional()
  @IsBoolean()
  reactions?: boolean;

  @IsOptional()
  @IsBoolean()
  follows?: boolean;
}
