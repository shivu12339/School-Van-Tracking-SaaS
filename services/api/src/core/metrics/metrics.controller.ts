import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { MetricsService } from './metrics.service';

@ApiTags('Metrics')
@Controller({ path: 'metrics', version: '1' })
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  /** Internal scrape endpoint — protect via network policy in production */
  @Public()
  @Get()
  snapshot() {
    return { counters: this.metrics.snapshot(), ts: new Date().toISOString() };
  }
}
