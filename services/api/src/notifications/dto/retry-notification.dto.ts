import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class RetryNotificationDto {
  @ApiPropertyOptional({ description: 'Retry single notification; omit to retry batch of failed' })
  @IsOptional()
  @IsUUID()
  notificationId?: string;
}
