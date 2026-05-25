import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { CreateStudentDto } from './create-student.dto';

export class BulkImportStudentsDto {
  @ApiProperty({ type: [CreateStudentDto] })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateStudentDto)
  students!: CreateStudentDto[];
}
