import { TripDirection, TripStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class UpdateTripDto {
  @IsOptional()
  @IsUUID()
  routeId?: string;

  @IsOptional()
  @IsUUID()
  vanId?: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsDateString()
  tripDate?: string;

  @IsOptional()
  @IsEnum(TripDirection)
  direction?: TripDirection;

  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;
}
