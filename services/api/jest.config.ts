import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/worker*.ts',
    '!src/bootstrap.ts',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: { branches: 35, functions: 40, lines: 45, statements: 45 },
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  verbose: true,
};

export default config;
