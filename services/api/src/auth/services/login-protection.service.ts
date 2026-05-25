import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { LOGIN_ATTEMPTS_PREFIX } from '../constants/auth.constants';

@Injectable()
export class LoginProtectionService {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  private get maxAttempts(): number {
    return this.configService.get<number>('auth.maxLoginAttempts', 5);
  }

  private get lockWindowSeconds(): number {
    return this.configService.get<number>('auth.lockWindowSeconds', 900);
  }

  private buildKey(email: string, ip: string): string {
    return `${LOGIN_ATTEMPTS_PREFIX}:${email.toLowerCase()}:${ip}`;
  }

  async assertNotRateLimited(email: string, ip: string): Promise<void> {
    const attempts = await this.redisService
      .getClient()
      .get(this.buildKey(email, ip));
    if (attempts && Number(attempts) >= this.maxAttempts) {
      throw new HttpException(
        'Too many login attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async recordFailedAttempt(email: string, ip: string): Promise<number> {
    const key = this.buildKey(email, ip);
    const client = this.redisService.getClient();
    const attempts = await client.incr(key);
    if (attempts === 1) {
      await client.expire(key, this.lockWindowSeconds);
    }
    return attempts;
  }

  async clearAttempts(email: string, ip: string): Promise<void> {
    await this.redisService.getClient().del(this.buildKey(email, ip));
  }
}
