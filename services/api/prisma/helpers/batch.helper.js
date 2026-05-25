"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BATCH_SIZE = void 0;
exports.batchCreateMany = batchCreateMany;
exports.DEFAULT_BATCH_SIZE = 500;
async function batchCreateMany(prisma, model, data, options) {
    const batchSize = options?.batchSize ?? exports.DEFAULT_BATCH_SIZE;
    const delegate = prisma[model];
    let inserted = 0;
    for (let i = 0; i < data.length; i += batchSize) {
        const chunk = data.slice(i, i + batchSize);
        const result = await delegate.createMany({
            data: chunk,
            skipDuplicates: options?.skipDuplicates,
        });
        inserted += result.count;
    }
    return inserted;
}
//# sourceMappingURL=batch.helper.js.map