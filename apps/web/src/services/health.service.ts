export const healthService = {
  check: async () => {
    const res = await fetch('/api/backend/health', { cache: 'no-store' });
    const json = await res.json();
    return (json.success ? json.data : json) as { status: string; uptime: number };
  },
};
