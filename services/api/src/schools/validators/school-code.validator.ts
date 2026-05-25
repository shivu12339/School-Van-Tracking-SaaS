import { BadRequestException } from '@nestjs/common';

const SCHOOL_CODE_REGEX = /^[A-Z0-9-]{3,32}$/;

export function assertValidSchoolCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (!SCHOOL_CODE_REGEX.test(normalized)) {
    throw new BadRequestException(
      'School code must be 3-32 chars using uppercase letters, numbers, or hyphen',
    );
  }
  return normalized;
}
