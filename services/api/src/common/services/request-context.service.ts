import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  requestId: string;
  schoolId?: string;
  userId?: string;
}

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextStore>();

  run<T>(store: RequestContextStore, fn: () => T): T {
    return this.storage.run(store, fn);
  }

  get(): RequestContextStore | undefined {
    return this.storage.getStore();
  }

  getRequestId(): string | undefined {
    return this.storage.getStore()?.requestId;
  }
}
