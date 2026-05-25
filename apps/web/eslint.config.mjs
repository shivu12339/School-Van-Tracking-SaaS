import next from '@schoolvan/config/eslint/next';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...next,
  {
    ignores: ['.next/**', 'node_modules/**', 'e2e/**'],
  },
];
