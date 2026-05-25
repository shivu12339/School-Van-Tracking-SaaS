/**
 * Nest/tsc emit to dist/src/*; nest start and Docker expect dist/main.js.
 */
const fs = require('node:fs');
const path = require('node:path');

const dist = path.join(__dirname, '..', 'dist');

const shims = [
  ['main.js', './src/main.js'],
  ['worker.main.js', './src/worker.main.js'],
];

for (const [file, target] of shims) {
  const out = path.join(dist, file);
  const srcEntry = path.join(dist, target.replace('./', ''));
  if (!fs.existsSync(srcEntry)) {
    console.warn(`[write-dist-shim] skip ${file}: ${srcEntry} not found yet`);
    continue;
  }
  fs.writeFileSync(out, `require('${target}');\n`);
  console.log(`[write-dist-shim] wrote ${out}`);
}
