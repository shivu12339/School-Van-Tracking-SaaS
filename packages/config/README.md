# @schoolvan/config

Shared tooling configuration.

## Usage

**ESLint** (`eslint.config.mjs`):

```js
import nest from '@schoolvan/config/eslint/nest';
export default [...nest];
```

**TypeScript** (`tsconfig.json`):

```json
{ "extends": "../../packages/config/typescript/nestjs.json" }
```

**Prettier** (root `prettier.config.mjs`):

```js
import config from '@schoolvan/config/prettier';
export default config;
```
