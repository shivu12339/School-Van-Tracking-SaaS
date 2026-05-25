/** Auth payloads for integration / security tests */
export const loginPayload = (overrides: Record<string, unknown> = {}) => ({
  email: 'driver@demo-school.app',
  password: 'Admin@12345',
  schoolCode: 'SVT-DEMO-001',
  ...overrides,
});

export const invalidJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0YW1wZXIifQ.invalid';
