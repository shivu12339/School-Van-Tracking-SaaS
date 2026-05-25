import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty()
  @IsUUID()
  parentId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  admissionNumber!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  fullName!: string;

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
  routeId?: string;
}
