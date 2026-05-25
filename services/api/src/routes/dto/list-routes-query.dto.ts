import { ApiPropertyOptional } from '@nestjs/swagger';
import { TripDirection } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { FleetSearchQueryDto } from '../../fleet/dto/search-query.dto';

export class ListRoutesQueryDto extends FleetSearchQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: TripDirection })
  @IsOptional()
  @IsEnum(TripDirection)
  direction?: TripDirection;
}
