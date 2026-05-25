"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTenantSoftDeleteExtension = buildTenantSoftDeleteExtension;
const tenant_scope_helper_1 = require("../helpers/tenant-scope.helper");
const tenant_context_store_1 = require("../../src/prisma/tenant-context.store");
const SOFT_DELETE_MODELS = new Set([
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
const READ_ACTIONS = new Set([
    'findUnique',
    'findFirst',
    'findMany',
    'count',
    'aggregate',
    'groupBy',
]);
const WRITE_ACTIONS = new Set([
    'create',
    'createMany',
    'update',
    'updateMany',
    'upsert',
]);
function prismaDelegateKey(model) {
    return (model.charAt(0).toLowerCase() + model.slice(1));
}
function getSoftDeleteDelegate(client, model) {
    const key = prismaDelegateKey(model);
    return client[key];
}
function buildTenantSoftDeleteExtension(client) {
    return {
        name: 'tenantSoftDelete',
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const m = model;
                    let effectiveOp = operation;
                    let nextArgs = { ...args };
                    if (SOFT_DELETE_MODELS.has(m)) {
                        const delegate = getSoftDeleteDelegate(client, m);
                        if (operation === 'delete') {
                            return delegate.update({
                                where: nextArgs.where,
                                data: { deletedAt: new Date() },
                            });
                        }
                        if (operation === 'deleteMany') {
                            const w = nextArgs.where ?? {};
                            const d = nextArgs.data ?? {};
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
                                    ...(nextArgs.where ?? {}),
                                    deletedAt: null,
                                },
                            };
                        }
                        else if (operation === 'findFirst' || operation === 'findMany') {
                            nextArgs = {
                                ...nextArgs,
                                where: {
                                    ...(nextArgs.where ?? {}),
                                    deletedAt: null,
                                },
                            };
                        }
                    }
                    if ((0, tenant_scope_helper_1.isTenantScopedModel)(m)) {
                        const store = (0, tenant_context_store_1.getTenantStore)();
                        if (store?.schoolId && !(0, tenant_scope_helper_1.shouldBypassTenant)(store)) {
                            const schoolId = store.schoolId;
                            if (READ_ACTIONS.has(effectiveOp)) {
                                nextArgs.where = {
                                    ...(nextArgs.where ?? {}),
                                    schoolId,
                                };
                            }
                            if (WRITE_ACTIONS.has(operation)) {
                                if (operation === 'create' || operation === 'upsert') {
                                    nextArgs.data = (0, tenant_scope_helper_1.assertSchoolIdOnCreate)(nextArgs.data ?? {}, schoolId);
                                }
                                if (operation === 'createMany') {
                                    const rows = Array.isArray(nextArgs.data)
                                        ? nextArgs.data
                                        : [nextArgs.data];
                                    nextArgs.data = rows.map((row) => (0, tenant_scope_helper_1.assertSchoolIdOnCreate)(row, schoolId));
                                }
                                if (operation === 'update' || operation === 'updateMany') {
                                    nextArgs.where = {
                                        ...(nextArgs.where ?? {}),
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
//# sourceMappingURL=tenant-soft-delete.extension.js.map