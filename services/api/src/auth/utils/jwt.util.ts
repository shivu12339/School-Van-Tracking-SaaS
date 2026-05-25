/**
 * Parse JWT TTL strings (e.g. `900s`, `15m`, `1h`, `7d`) to seconds for Redis blacklist TTL.
 */
export function parseJwtTtlToSeconds(ttl: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(ttl.trim());
  if (!match) {
    return 900;
  }
  const value = Number(match[1]);
  switch (match[2]) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86_400;
    default:
      return 900;
  }
}
