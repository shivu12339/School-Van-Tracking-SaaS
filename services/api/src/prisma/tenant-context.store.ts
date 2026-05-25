import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantStore {
  schoolId?: string;
  userId?: string;
  bypassTenantScope?: boolean;
}

export const tenantContextStore = new AsyncLocalStorage<TenantStore>();

export function getTenantStore(): TenantStore | undefined {
  return tenantContextStore.getStore();
}

export function runWithTenantContext<T>(store: TenantStore, fn: () => T): T {
  return tenantContextStore.run(store, fn);
}
