# @magus-mark/eslint-config

Shared ESLint configuration for Obsidian Magic projects.

## Usage

### Installation

The package is available as a workspace dependency:

```bash
"@magus-mark/eslint-config": "workspace:*"
```

### Using in a project

Create an `eslint.config.js` file in your project root:

```js
// eslint.config.js
import customConfig from '@magus-mark/eslint-config';

export default [
  ...customConfig,

  // Add any project-specific overrides here
  {
    files: ['src/**/*.ts'],
    rules: {
      // Project-specific rule overrides
    },
  },
];
```

### Configuration Structure

This configuration:

1. Extends the shared configurations in `config/eslint/`
2. Provides sensible defaults for TypeScript, JavaScript, React and test files
3. Integrates with Prettier for consistent formatting
4. Includes accessibility rules (jsx-a11y)

## Included Plugins

- TypeScript ESLint (`@typescript-eslint/eslint-plugin`)
- Import Plugin (`eslint-plugin-import-x`)
- React (`eslint-plugin-react`)
- React Hooks (`eslint-plugin-react-hooks`)
- JSX Accessibility (`eslint-plugin-jsx-a11y`)
- Testing Library (`eslint-plugin-testing-library`)
