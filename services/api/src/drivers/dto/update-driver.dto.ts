import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateDriverDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  licenseValidTill?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class UpdateDriverStatusDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class AssignDriverVanDto {
  @ApiProperty()
  @IsUUID()
  vanId!: string;
}

export class AssignDriverRouteDto {
  @ApiProperty()
  @IsUUID()
  routeId!: string;
}
