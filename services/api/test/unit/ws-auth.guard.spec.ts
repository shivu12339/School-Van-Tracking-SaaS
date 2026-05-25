import { type ExecutionContext } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { type JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { RoleCode } from '@prisma/client';
import { WsAuthGuard } from '../../src/tracking/guards/ws-auth.guard';

describe('WsAuthGuard', () => {
  const jwt = { verifyAsync: jest.fn() } as unknown as JwtService;
  const config = {
    getOrThrow: jest.fn().mockReturnValue('test_access_secret_minimum_32_characters'),
  } as unknown as ConfigService;
  const guard = new WsAuthGuard(jwt, config);

  const wsContext = (handshake: object) =>
    ({
      switchToWs: () => ({
        getClient: () => ({ handshake, data: {} }),
      }),
    }) as ExecutionContext;

  it('rejects missing token', async () => {
    await expect(guard.canActivate(wsContext({ auth: {}, headers: {} }))).rejects.toBeInstanceOf(
      WsException,
    );
  });

  it('accepts valid JWT', async () => {
    (jwt.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      email: 'a@b.com',
      schoolId: 'school-1',
      role: RoleCode.PARENT,
      sessionId: 'sess-1',
      permissions: [],
      jti: 'jti-1',
    });
    const client = { handshake: { auth: { token: 'valid' }, headers: {} }, data: {} };
    const ok = await guard.canActivate({
      switchToWs: () => ({ getClient: () => client }),
    } as ExecutionContext);
    expect(ok).toBe(true);
    expect(client.data.user?.id).toBe('user-1');
  });
});
