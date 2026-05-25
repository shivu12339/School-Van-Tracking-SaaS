import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { SKIP_RESPONSE_WRAP_KEY } from '../decorators/skip-response-wrap.decorator';
import { ApiSuccessResponse } from '../dto/api-response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T>> {
    const skipWrap = this.reflector.getAllAndOverride<boolean>(SKIP_RESPONSE_WRAP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipWrap) {
      return next.handle() as Observable<ApiSuccessResponse<T>>;
    }

    return next.handle().pipe(
      map((data) => {
        const request = context.switchToHttp().getRequest<{ requestId?: string }>();
        return {
          success: true,
          data,
          meta: {
            requestId: request.requestId ?? null,
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
