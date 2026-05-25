"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePagination = normalizePagination;
exports.buildPaginatedResult = buildPaginatedResult;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
function normalizePagination(input) {
    const page = Math.max(DEFAULT_PAGE, input?.page ?? DEFAULT_PAGE);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, input?.pageSize ?? DEFAULT_PAGE_SIZE));
    return {
        page,
        pageSize,
        skip: (page - 1) * pageSize,
        take: pageSize,
    };
}
function buildPaginatedResult(data, total, page, pageSize) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return {
        data,
        meta: {
            page,
            pageSize,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}
//# sourceMappingURL=pagination.helper.js.map