import { PrismaClient } from '@prisma/client';
type AllOpsParams = {
    model: string;
    operation: string;
    args: unknown;
    query: (a: unknown) => Promise<unknown>;
};
export declare function buildTenantSoftDeleteExtension(client: PrismaClient): {
    name: string;
    query: {
        $allModels: {
            $allOperations({ model, operation, args, query }: AllOpsParams): Promise<unknown>;
        };
    };
};
export {};
//# sourceMappingURL=tenant-soft-delete.extension.d.ts.map