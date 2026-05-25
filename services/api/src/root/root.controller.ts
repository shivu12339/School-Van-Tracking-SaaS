import { Controller, Get } from '@nestjs/common';
import { SkipResponseWrap } from '../common/decorators/skip-response-wrap.decorator';

@Controller()
export class RootController {
  @Get()
  @SkipResponseWrap()
  root() {
    return {
      service: 'schoolvan-api',
      status: 'ok',
      docs: '/api/docs',
      health: '/api/v1/health',
      ready: '/api/v1/health/ready',
    };
  }
}
