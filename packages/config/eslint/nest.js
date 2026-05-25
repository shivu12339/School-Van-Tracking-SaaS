import base from './base.js';
import tseslint from 'typescript-eslint';

/** NestJS API — extends strict base with decorator-friendly settings. */
export default tseslint.config(
  ...base,
  {
    files: ['**/test/**/*.ts', '**/*.spec.ts', '**/*.e2e-spec.ts'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      'no-console': 'off',
    },
  },
);
