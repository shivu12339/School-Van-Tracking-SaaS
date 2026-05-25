import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class BroadcastNotificationDto {
  @ApiPropertyOptional({ description: 'Required for super admin; inferred for school admin' })
  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  body!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deepLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];
}
