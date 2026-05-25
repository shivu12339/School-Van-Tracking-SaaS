function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1',
  wsBaseUrl: process.env.NEXT_PUBLIC_WS_BASE_URL ?? 'http://localhost:4000',
  googleMapsKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  jwtSecret: process.env.JWT_ACCESS_SECRET,
};

export function getServerApiUrl(): string {
  return process.env.API_INTERNAL_URL ?? env.apiBaseUrl;
}

export function getJwtSecret(): string {
  return required('JWT_ACCESS_SECRET', process.env.JWT_ACCESS_SECRET);
}
