import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { FleetSearchQueryDto } from '../../fleet/dto/search-query.dto';

export class ListDriversQueryDto extends FleetSearchQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isAvailable?: boolean;
}
