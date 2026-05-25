/**
 * Loads monorepo `.env` for Prisma CLI and seed (cwd is usually `services/api`).
 * Preload: node -r ./prisma/load-env.cjs …
 */
const fs = require('node:fs');
const path = require('node:path');

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\\n/g, '\n');
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const candidates = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '..', '.env'),
  path.join(process.cwd(), '..', '..', '.env'),
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '..', '.env'),
];

for (const envPath of [...new Set(candidates)]) {
  if (fs.existsSync(envPath)) {
    parseEnvFile(envPath);
  }
}
