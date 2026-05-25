import { describe, expect, it } from 'vitest';

describe('API client configuration', () => {
  it('uses versioned API base in env', () => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';
    expect(base).toMatch(/\/api\/v1$/);
  });

  it('websocket base has no api prefix', () => {
    const ws = process.env.NEXT_PUBLIC_WS_BASE_URL ?? 'http://localhost:4000';
    expect(ws).not.toMatch(/\/api\/v1$/);
  });
});
