import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class UpdateVanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  registrationNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gpsDeviceCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignVanRouteDto {
  @ApiProperty()
  @IsUUID()
  routeId!: string;
}
