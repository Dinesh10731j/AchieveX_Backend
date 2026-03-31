import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ProofType } from '../../database/entities';

export class CreateProofDto {
  @IsUUID('4')
  manifestationId!: string;

  @IsEnum(ProofType)
  type!: ProofType;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  textContent?: string;
}
