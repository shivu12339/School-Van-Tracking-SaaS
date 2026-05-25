import { Global, Module } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { TenantCacheService } from './tenant-cache.service';
import { TenantInterceptor } from './tenant.interceptor';
import { WsTenantAccessService } from './ws-tenant-access.service';

@Global()
@Module({
  providers: [TenantContextService, TenantCacheService, TenantInterceptor, WsTenantAccessService],
  exports: [TenantContextService, TenantCacheService, TenantInterceptor, WsTenantAccessService],
})
export class TenantModule {}
