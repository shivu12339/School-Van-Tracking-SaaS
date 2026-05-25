import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TripDirection } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateRouteDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  routeCode!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  routeName!: string;

  @ApiPropertyOptional({ enum: TripDirection })
  @IsOptional()
  @IsEnum(TripDirection)
  direction?: TripDirection;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vanId?: string;
}
