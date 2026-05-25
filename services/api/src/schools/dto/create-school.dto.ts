import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanTier } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSchoolDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  code!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ default: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ enum: PlanTier })
  @IsEnum(PlanTier)
  planTier!: PlanTier;

  @ApiProperty()
  @IsEmail()
  adminEmail!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  adminPassword!: string;

  @ApiProperty()
  @IsString()
  adminFirstName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminLastName?: string;

  @ApiPropertyOptional({ default: 14 })
  @IsOptional()
  trialDays?: number;
}
