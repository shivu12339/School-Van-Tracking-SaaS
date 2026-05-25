import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FleetSearchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by name, code, email, or registration' })
  @IsOptional()
  @IsString()
  search?: string;
}
