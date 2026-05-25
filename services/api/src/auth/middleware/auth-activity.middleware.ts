import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { SessionService } from '../services/session.service';

/**
 * Updates device session last-seen timestamp for authenticated API traffic.
 */
@Injectable()
export class AuthActivityMiddleware implements NestMiddleware {
  constructor(private readonly sessionService: SessionService) {}

  use(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    const sessionId = req.user?.sessionId;
    if (sessionId) {
      void this.sessionService.touchSession(sessionId);
    }
    next();
  }
}
