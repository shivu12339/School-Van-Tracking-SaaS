import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDriverDto {
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

  @ApiProperty()
  @IsString()
  @MinLength(3)
  licenseNumber!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  licenseValidTill?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeCode?: string;
}
