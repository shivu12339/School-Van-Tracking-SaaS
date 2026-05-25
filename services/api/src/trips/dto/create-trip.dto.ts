import { TripDirection } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class TripStudentAssignDto {
  @IsUUID()
  studentId!: string;

  @IsOptional()
  @IsUUID()
  stopId?: string;
}

export class CreateTripDto {
  @IsUUID()
  routeId!: string;

  @IsUUID()
  vanId!: string;

  @IsUUID()
  driverId!: string;

  @IsDateString()
  tripDate!: string;

  @IsEnum(TripDirection)
  direction!: TripDirection;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TripStudentAssignDto)
  students?: TripStudentAssignDto[];
}
