import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateNotificationPreferenceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabledTypes?: string[];

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @IsString()
  quietHoursStart?: string;

  @ApiPropertyOptional({ example: '06:00' })
  @IsOptional()
  @IsString()
  quietHoursEnd?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;
}
