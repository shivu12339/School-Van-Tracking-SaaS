import { IsUUID } from 'class-validator';

export class TripActionDto {
  @IsUUID()
  tripId!: string;
}

export class StudentTripActionDto {
  @IsUUID()
  tripId!: string;

  @IsUUID()
  studentId!: string;
}

export class SosTriggerDto {
  @IsUUID()
  tripId!: string;

  latitude?: number;
  longitude?: number;
  description?: string;
}
