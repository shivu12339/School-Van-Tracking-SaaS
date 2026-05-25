import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QueueHealthService } from './queue-health.service';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queueHealth: QueueHealthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get()
  liveness(): { status: string; uptime: number; role: string } {
    return {
      status: 'ok',
      uptime: process.uptime(),
      role: this.config.get<string>('app.processRole', 'api'),
    };
  }

  /** Railway / Vercel / load balancer readiness probe */
  @Public()
  @Get('ready')
  async readiness(): Promise<{
    status: string;
    checks: Record<string, string | number>;
  }> {
    const checks: Record<string, string | number> = { api: 'ok' };

    try {
      await this.prisma.pingDatabase();
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    checks.redis = (await this.redis.isHealthy()) ? 'ok' : 'error';

    const role = this.config.get<string>('app.processRole', 'api');
    if (role === 'api' || role === 'worker' || role === 'all') {
      const queueStatus = await this.queueHealth.check();
      checks.queues = queueStatus.status;
      if (queueStatus.waiting != null) checks.queue_waiting = queueStatus.waiting;
      if (queueStatus.failed != null) checks.queue_failed = queueStatus.failed;
    }

    const coreHealthy = checks.database === 'ok' && checks.redis === 'ok';
    const queueOk =
      checks.queues === undefined || checks.queues === 'ok' || checks.queues === 'degraded';
    const status = coreHealthy && queueOk ? 'ok' : 'degraded';
    return { status, checks };
  }
}
