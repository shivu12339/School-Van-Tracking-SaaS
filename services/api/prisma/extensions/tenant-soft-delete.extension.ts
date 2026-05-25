import { PrismaClient } from '@prisma/client';
import {
  assertSchoolIdOnCreate,
  isTenantScopedModel,
  shouldBypassTenant,
} from '../helpers/tenant-scope.helper';
import { getTenantStore } from '../../src/prisma/tenant-context.store';

const SOFT_DELETE_MODELS = new Set<string>([
  'School',
  'SubscriptionPlan',
  'Role',
  'User',
  'Driver',
  'Parent',
  'Student',
  'Van',
  'Route',
  'RouteStop',
  'Trip',
  'TripStudent',
  'Notification',
  'EmergencyAlert',
]);

const READ_ACTIONS = new Set<string>([
  'findUnique',
  'findFirst',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);

const WRITE_ACTIONS = new Set<string>([
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
]);

function prismaDelegateKey(model: string): keyof PrismaClient {
  return (model.charAt(0).toLowerCase() + model.slice(1)) as keyof PrismaClient;
}

type SoftDeleteDelegate = {
  update: (args: unknown) => Promise<unknown>;
  updateMany: (args: unknown) => Promise<unknown>;
  findFirst: (args: unknown) => Promise<unknown>;
};

function getSoftDeleteDelegate(client: PrismaClient, model: string): SoftDeleteDelegate {
  const key = prismaDelegateKey(model);
  return client[key] as unknown as SoftDeleteDelegate;
}

type AllOpsParams = {
  model: string;
  operation: string;
  args: unknown;
  query: (a: unknown) => Promise<unknown>;
};

/**
 * Replaces deprecated Prisma `$use` middleware (removed in Prisma 6+).
 * Middleware order was: soft-delete → tenant scope.
 *
 * Apply as `base.$extends(buildTenantSoftDeleteExtension(base))`.
 */
export function buildTenantSoftDeleteExtension(client: PrismaClient) {
  return {
    name: 'tenantSoftDelete',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: AllOpsParams) {
          const m = model as string;
          let effectiveOp = operation as string;
          let nextArgs = { ...(args as Record<string, unknown>) };

          if (SOFT_DELETE_MODELS.has(m)) {
            const delegate = getSoftDeleteDelegate(client, m);

            if (operation === 'delete') {
              return delegate.update({
                where: (nextArgs as { where?: unknown }).where,
                data: { deletedAt: new Date() },
              });
            }

            if (operation === 'deleteMany') {
              const w = (nextArgs as { where?: Record<string, unknown> }).where ?? {};
              const d = (nextArgs as { data?: Record<string, unknown> }).data ?? {};
              return delegate.updateMany({
                where: w,
                data: { ...d, deletedAt: new Date() },
              });
            }

            if (operation === 'findUnique') {
              effectiveOp = 'findFirst';
              nextArgs = {
                ...nextArgs,
                where: {
                  ...((nextArgs.where as Record<string, unknown> | undefined) ?? {}),
                  deletedAt: null,
                },
              };
            } else if (operation === 'findFirst' || operation === 'findMany') {
              nextArgs = {
                ...nextArgs,
                where: {
                  ...((nextArgs.where as Record<string, unknown> | undefined) ?? {}),
                  deletedAt: null,
                },
              };
            }
          }

          if (isTenantScopedModel(m)) {
            const store = getTenantStore();
            if (store?.schoolId && !shouldBypassTenant(store)) {
              const schoolId = store.schoolId;

              if (READ_ACTIONS.has(effectiveOp)) {
                nextArgs.where = {
                  ...((nextArgs.where as Record<string, unknown> | undefined) ?? {}),
                  schoolId,
                };
              }

              if (WRITE_ACTIONS.has(operation as string)) {
                if (operation === 'create' || operation === 'upsert') {
                  nextArgs.data = assertSchoolIdOnCreate(
                    (nextArgs.data as Record<string, unknown>) ?? {},
                    schoolId,
                  );
                }
                if (operation === 'createMany') {
                  const rows = Array.isArray(nextArgs.data)
                    ? (nextArgs.data as Record<string, unknown>[])
                    : [nextArgs.data as Record<string, unknown>];
                  nextArgs.data = rows.map((row) => assertSchoolIdOnCreate(row, schoolId));
                }
                if (operation === 'update' || operation === 'updateMany') {
                  nextArgs.where = {
                    ...((nextArgs.where as Record<string, unknown> | undefined) ?? {}),
                    schoolId,
                  };
                }
              }
            }
          }

          if (SOFT_DELETE_MODELS.has(m) && operation === 'findUnique') {
            return getSoftDeleteDelegate(client, m).findFirst(nextArgs);
          }

          return query(nextArgs);
        },
      },
    },
  };
}
