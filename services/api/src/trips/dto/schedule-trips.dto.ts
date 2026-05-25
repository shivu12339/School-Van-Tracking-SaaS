import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/** Generate morning pickup + evening dropoff trips for a route on a date. */
export class ScheduleTripsDto {
  @IsUUID()
  routeId!: string;

  @IsDateString()
  tripDate!: string;

  @IsOptional()
  @IsUUID()
  vanId?: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;
}
