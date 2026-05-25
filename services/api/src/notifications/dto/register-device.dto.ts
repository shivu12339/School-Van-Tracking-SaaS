import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  deviceId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(20)
  fcmToken!: string;

  @ApiProperty({ enum: ['ANDROID', 'IOS', 'WEB'] })
  @IsEnum(['ANDROID', 'IOS', 'WEB'])
  platform!: 'ANDROID' | 'IOS' | 'WEB';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appVersion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  deviceInfo?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  schoolId?: string;
}
