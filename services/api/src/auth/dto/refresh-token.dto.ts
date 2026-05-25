import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description: 'Opaque refresh token (optional when sent via svt_refresh HTTP-only cookie)',
  })
  @IsOptional()
  @IsString()
  @MinLength(32)
  refreshToken?: string;
}
