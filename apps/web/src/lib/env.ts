function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * The Socket.IO server lives at the API host root (e.g. https://api.up.railway.app)
 * and exposes namespaces under `/tracking`, `/notifications`, etc. Operators
 * sometimes paste the REST base by mistake (`.../api/v1`) — strip those suffixes
 * so the client always lands on the host root.
 */
function normalizeWsBase(url: string): string {
  return stripTrailingSlash(url).replace(/\/api(?:\/v\d+)?$/, '').replace(/\/socket\.io\/?$/, '');
}

const rawApiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const rawWsBase = process.env.NEXT_PUBLIC_WS_BASE_URL ?? 'http://localhost:4000';

export const env = {
  apiBaseUrl: stripTrailingSlash(rawApiBase),
  wsBaseUrl: normalizeWsBase(rawWsBase),
  googleMapsKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  jwtSecret: process.env.JWT_ACCESS_SECRET,
};

export function getServerApiUrl(): string {
  return stripTrailingSlash(process.env.API_INTERNAL_URL ?? env.apiBaseUrl);
}

export function getJwtSecret(): string {
  return required('JWT_ACCESS_SECRET', process.env.JWT_ACCESS_SECRET);
}
