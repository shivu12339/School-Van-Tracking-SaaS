import { HttpException, HttpStatus } from '@nestjs/common';
import { type ErrorCode } from './error-codes';

export class AppException extends HttpException {
  constructor(
    message: string,
    errorCode: ErrorCode,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: unknown,
  ) {
    super(
      {
        success: false,
        error: {
          code: errorCode,
          message,
          details: details ?? null,
        },
      },
      status,
    );
  }
}
