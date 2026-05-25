import base from './base.js';
import globals from 'globals';

/** Next.js web app — browser + Node for API routes. */
export default [
  ...base,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
];
