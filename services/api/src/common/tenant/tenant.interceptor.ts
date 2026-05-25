import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';

/**
 * Attaches tenant context to logs and ensures request carries resolved school id.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();
    const user = request.user;
    const schoolId = request.tenantSchoolId ?? user?.schoolId ?? null;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          if (process.env.NODE_ENV === 'development' && user) {
            const ms = Date.now() - start;
            this.logger.debug(
              `tenant=${schoolId ?? 'platform'} user=${user.id} role=${user.role} ${ms}ms ${request.method} ${request.url}`,
            );
          }
        },
      }),
    );
  }
}
