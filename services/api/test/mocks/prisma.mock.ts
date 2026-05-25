import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, type DeepMockProxy } from 'jest-mock-extended';

export type PrismaMock = DeepMockProxy<PrismaClient>;

export const prismaMock = mockDeep<PrismaClient>();

export function resetPrismaMock(): void {
  mockReset(prismaMock);
}

/** Nest provider factory for unit tests */
export const prismaMockProvider = {
  provide: PrismaClient,
  useValue: prismaMock,
};
