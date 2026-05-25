import '@testing-library/jest-dom/vitest';

process.env.JWT_ACCESS_SECRET = 'test_access_secret_minimum_32_characters';
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:4000/api/v1';
process.env.NEXT_PUBLIC_WS_BASE_URL = 'http://localhost:4000';
