import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchoolOperationalStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdateSchoolStatusDto {
  @ApiProperty({ enum: SchoolOperationalStatus })
  @IsEnum(SchoolOperationalStatus)
  status!: SchoolOperationalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
