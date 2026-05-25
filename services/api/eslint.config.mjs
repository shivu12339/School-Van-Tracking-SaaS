import nest from '@schoolvan/config/eslint/nest';

/** @type {import('eslint').Linter.Config[]} */
export default [...nest, { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] }];
