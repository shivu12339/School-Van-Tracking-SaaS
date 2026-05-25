import { Type } from 'class-transformer';
import { IsBoolean, IsISO8601, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class GpsLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsNumber()
  @Min(0)
  @Max(250)
  speed!: number;

  @IsNumber()
  @Min(0)
  @Max(360)
  heading!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @IsISO8601()
  timestamp!: string;

  @IsOptional()
  @IsBoolean()
  isMocked?: boolean;
}

export class TrackingUpdateDto extends GpsLocationDto {
  @IsUUID()
  tripId!: string;
}

export class OfflineSyncDto {
  @IsUUID()
  tripId!: string;

  @Type(() => GpsLocationDto)
  points!: GpsLocationDto[];
}
