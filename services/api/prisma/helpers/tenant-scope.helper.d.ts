export declare const TENANT_SCOPED_MODELS: Set<string>;
export declare function isTenantScopedModel(model?: string): boolean;
export declare function mergeSchoolIdWhere<T extends Record<string, unknown>>(where: T | undefined, schoolId: string): T & {
    schoolId: string;
};
export declare function assertSchoolIdOnCreate(data: Record<string, unknown>, schoolId: string): Record<string, unknown>;
export type TenantBypassFlag = {
    bypassTenantScope?: boolean;
};
export declare function shouldBypassTenant(args?: TenantBypassFlag): boolean;
//# sourceMappingURL=tenant-scope.helper.d.ts.map