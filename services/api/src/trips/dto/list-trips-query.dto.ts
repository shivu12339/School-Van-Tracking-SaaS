import { TripDirection, TripStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListTripsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @IsOptional()
  @IsEnum(TripDirection)
  direction?: TripDirection;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsUUID()
  vanId?: string;

  @IsOptional()
  @IsUUID()
  routeId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
