import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { REQUEST_ID_HEADER } from '../constants/app.constants';

type RequestWithId = Request & { requestId?: string };

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const requestId = (req.headers[REQUEST_ID_HEADER] as string | undefined) ?? uuidv4();
    req.requestId = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  }
}
