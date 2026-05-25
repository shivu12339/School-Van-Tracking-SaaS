import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateRouteStopDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  stopName!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  stopOrder!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  stopLatitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  stopLongitude?: number;

  @ApiPropertyOptional({ description: 'Estimated arrival offset in minutes from trip start' })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedArrivalMinutes?: number;
}

export class ReorderRouteStopsDto {
  @ApiProperty({
    description: 'Ordered list of stop ids',
    type: [String],
  })
  stopIds!: string[];
}
