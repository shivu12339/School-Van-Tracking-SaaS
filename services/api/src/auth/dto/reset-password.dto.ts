import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(32)
  resetToken!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
