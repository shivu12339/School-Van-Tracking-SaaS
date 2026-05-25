"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slowQueryLoggingExtension = slowQueryLoggingExtension;
const client_1 = require("@prisma/client");
function slowQueryLoggingExtension(thresholdMs = 200) {
    return client_1.Prisma.defineExtension({
        name: 'slowQueryLogging',
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const start = Date.now();
                    const result = await query(args);
                    const elapsed = Date.now() - start;
                    if (elapsed >= thresholdMs && process.env.NODE_ENV !== 'production') {
                        console.warn(`[prisma:slow] ${model}.${operation} ${elapsed}ms`);
                    }
                    return result;
                },
            },
        },
    });
}
//# sourceMappingURL=prisma-client.extension.js.map