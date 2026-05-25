import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SchoolBrandingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateSchoolSettingsDto {
  @ApiPropertyOptional({ description: '1km geofence radius in meters' })
  @IsOptional()
  @IsInt()
  @Min(100)
  pickupRadius1Km?: number;

  @ApiPropertyOptional({ description: '500m geofence radius in meters' })
  @IsOptional()
  @IsInt()
  @Min(50)
  pickupRadius500m?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  liveTrackingEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sosEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ type: SchoolBrandingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SchoolBrandingDto)
  schoolBranding?: SchoolBrandingDto;
}
