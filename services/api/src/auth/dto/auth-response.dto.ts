import { ApiProperty } from '@nestjs/swagger';
import { RoleCode } from '@prisma/client';

export class AuthUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  schoolId!: string | null;

  @ApiProperty({ enum: RoleCode })
  role!: RoleCode;

  @ApiProperty()
  sessionId!: string;

  @ApiProperty({ type: [String] })
  permissions!: string[];

  @ApiProperty()
  firstName!: string;

  @ApiProperty({ nullable: true })
  lastName!: string | null;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ description: 'Returned in body for mobile; also set as HTTP-only cookie when useCookies=true' })
  refreshToken!: string;

  @ApiProperty({ type: AuthUserResponseDto })
  user!: AuthUserResponseDto;
}

export class TokenPairResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}
