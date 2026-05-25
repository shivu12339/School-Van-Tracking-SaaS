export type PaginationInput = {
    page?: number;
    pageSize?: number;
};
export type PaginatedResult<T> = {
    data: T[];
    meta: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
};
export declare function normalizePagination(input?: PaginationInput): {
    page: number;
    pageSize: number;
    skip: number;
    take: number;
};
export declare function buildPaginatedResult<T>(data: T[], total: number, page: number, pageSize: number): PaginatedResult<T>;
//# sourceMappingURL=pagination.helper.d.ts.map