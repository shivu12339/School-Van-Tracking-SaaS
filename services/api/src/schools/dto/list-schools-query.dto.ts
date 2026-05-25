import { ApiPropertyOptional } from '@nestjs/swagger';
import { SchoolOperationalStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListSchoolsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SchoolOperationalStatus })
  @IsOptional()
  @IsEnum(SchoolOperationalStatus)
  status?: SchoolOperationalStatus;
}
