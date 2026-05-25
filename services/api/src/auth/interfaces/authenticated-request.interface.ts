import { type Request } from 'express';
import { type RefreshTokenContext } from '../services/refresh-token-validator.service';
import { type AuthUser } from '../types/auth-user.type';
import { type REFRESH_TOKEN_CONTEXT_KEY } from '../constants/auth.constants';

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
  requestId?: string;
  tenantSchoolId?: string | null;
  [REFRESH_TOKEN_CONTEXT_KEY]?: RefreshTokenContext;
}
