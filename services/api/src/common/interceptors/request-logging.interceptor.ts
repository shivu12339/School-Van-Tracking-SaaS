import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      originalUrl: string;
      requestId?: string;
    }>();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(
          `${request.method} ${request.originalUrl} - ${duration}ms requestId=${request.requestId ?? 'n/a'}`,
        );
      }),
    );
  }
}
