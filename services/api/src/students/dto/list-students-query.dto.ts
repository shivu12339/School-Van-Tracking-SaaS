import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { FleetSearchQueryDto } from '../../fleet/dto/search-query.dto';

export class ListStudentsQueryDto extends FleetSearchQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  routeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
