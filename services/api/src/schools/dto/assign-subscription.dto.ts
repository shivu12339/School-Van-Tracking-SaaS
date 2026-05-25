import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingStatus, PlanTier } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class AssignSubscriptionDto {
  @ApiProperty({ enum: PlanTier })
  @IsEnum(PlanTier)
  planTier!: PlanTier;

  @ApiPropertyOptional({ enum: BillingStatus })
  @IsOptional()
  @IsEnum(BillingStatus)
  billingStatus?: BillingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  graceEndsAt?: string;
}
