"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TENANT_SCOPED_MODELS = void 0;
exports.isTenantScopedModel = isTenantScopedModel;
exports.mergeSchoolIdWhere = mergeSchoolIdWhere;
exports.assertSchoolIdOnCreate = assertSchoolIdOnCreate;
exports.shouldBypassTenant = shouldBypassTenant;
exports.TENANT_SCOPED_MODELS = new Set([
    'SubscriptionPlan',
    'Driver',
    'Parent',
    'Student',
    'Van',
    'Route',
    'RouteStop',
    'Trip',
    'TripStudent',
    'TrackingLog',
    'Notification',
    'EmergencyAlert',
]);
function isTenantScopedModel(model) {
    return Boolean(model && exports.TENANT_SCOPED_MODELS.has(model));
}
function mergeSchoolIdWhere(where, schoolId) {
    return { ...(where ?? {}), schoolId };
}
function assertSchoolIdOnCreate(data, schoolId) {
    if (data.schoolId && data.schoolId !== schoolId) {
        throw new Error('Cross-tenant schoolId injection blocked');
    }
    return { ...data, schoolId };
}
function shouldBypassTenant(args) {
    return args?.bypassTenantScope === true;
}
//# sourceMappingURL=tenant-scope.helper.js.map