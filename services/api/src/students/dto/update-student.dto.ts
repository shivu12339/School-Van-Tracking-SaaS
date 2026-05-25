import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateStudentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  homeAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  homeLatitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  homeLongitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  routeId?: string | null;
}

export class AssignStudentRouteDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  routeId?: string | null;
}
