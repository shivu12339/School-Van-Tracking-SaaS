import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../exceptions/error-codes';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const message = this.extractMessage(exceptionResponse);
    const code = this.mapErrorCode(status, exceptionResponse);

    this.logger.error(
      `requestId=${request.requestId ?? 'n/a'} ${request.method} ${request.url} status=${status} code=${code}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details:
          typeof exceptionResponse === 'object' && status === HttpStatus.BAD_REQUEST
            ? exceptionResponse
            : undefined,
      },
      meta: {
        requestId: request.requestId ?? null,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }

  private extractMessage(exceptionResponse: string | object): string | string[] {
    if (typeof exceptionResponse === 'string') return exceptionResponse;
    if (exceptionResponse && 'message' in exceptionResponse) {
      return (exceptionResponse as { message: string | string[] }).message;
    }
    return 'Request failed';
  }

  private mapErrorCode(status: number, exceptionResponse: string | object): ErrorCode {
    if (status === HttpStatus.UNAUTHORIZED) return ErrorCode.UNAUTHORIZED;
    if (status === HttpStatus.FORBIDDEN) return ErrorCode.FORBIDDEN;
    if (status === HttpStatus.NOT_FOUND) return ErrorCode.RESOURCE_NOT_FOUND;
    if (status === HttpStatus.TOO_MANY_REQUESTS) return ErrorCode.RATE_LIMIT_EXCEEDED;
    if (status === HttpStatus.BAD_REQUEST) {
      const body = exceptionResponse as { message?: string | string[] };
      if (Array.isArray(body.message)) return ErrorCode.VALIDATION_FAILED;
      return ErrorCode.VALIDATION_FAILED;
    }
    if (status >= 500) return ErrorCode.INTERNAL_SERVER_ERROR;
    return ErrorCode.VALIDATION_FAILED;
  }
}
