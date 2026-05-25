import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateParentDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Father, Mother, Guardian, etc.' })
  @IsOptional()
  @IsString()
  relationship?: string;

  @ApiPropertyOptional({ description: 'Emergency contact phone' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;
}
