import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateVanDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  registrationNo!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gpsDeviceCode?: string;
}
