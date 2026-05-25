import { ApiPropertyOptional } from '@nestjs/swagger';
import { TripDirection } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateRouteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  routeCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  routeName?: string;

  @ApiPropertyOptional({ enum: TripDirection })
  @IsOptional()
  @IsEnum(TripDirection)
  direction?: TripDirection;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vanId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
