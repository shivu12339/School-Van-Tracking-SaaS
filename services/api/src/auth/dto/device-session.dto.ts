import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class DeviceSessionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  deviceId!: string;

  @ApiProperty()
  platform!: string;

  @ApiProperty({ required: false })
  appVersion?: string | null;

  @ApiProperty({ required: false })
  ipAddress?: string | null;

  @ApiProperty({ required: false })
  userAgent?: string | null;

  @ApiProperty({ required: false })
  lastSeenAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  expiresAt!: Date;
}

export class RevokeDeviceSessionDto {
  @ApiProperty({ description: 'Device identifier from login' })
  @IsString()
  @MinLength(1)
  deviceId!: string;
}
