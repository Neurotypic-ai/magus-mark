# Nx Addons, Plugins, and Best Practices for Obsidian Magic

## Table of Contents

- [Current Nx Setup](#current-nx-setup)
- [Recommended Nx Plugins & Addons](#recommended-nx-plugins--addons)
- [Module Boundaries & Tagging](#module-boundaries--tagging)
- [Workspace Generators](#workspace-generators)
- [Actionable Recommendations](#actionable-recommendations)
- [References](#references)

---

## Current Nx Setup

- **Inferred Targets**: Nx is configured with inferred targets for build, test, lint, etc.
- **Project Tags**: Each project is tagged (e.g., `core`, `shared`, `app`, `cli`, `obsidian`, `vscode`).
- **Implicit Dependencies**: Apps depend on `packages/core` as needed.
- **Custom Generators**: Workspace generators for `library` and `app` exist in `tools/generators/`.
- **Centralized Config**: Lint, test, and build configs are centralized.
- **Named Inputs**: Used for production and test targets.
- **Plugins**: ESLint and Vite plugins are enabled.

---

## Recommended Nx Plugins & Addons

- **@nx/enforce-module-boundaries**: Enforce strict boundaries between apps and packages.
- **@nx/vite**: Already in use for Vite-powered builds and tests.
- **@nx/eslint**: Already in use for linting.
- **@nx/js**: For advanced JS/TS project management.
- **@nx/workspace**: For custom workspace utilities and generators.
- **nx-cloud**: For distributed caching and CI/CD acceleration.
- **@nx/graph**: For visualizing project dependencies.
- **@nx/devkit**: For writing advanced generators and executors.

---

## Module Boundaries & Tagging

### Best Practices

- **Keep tags minimal and meaningful**: Use tags like `type:app`, `type:core`, `scope:shared`, `scope:cli`, etc.
- **Enforce boundaries**: Use `@nx/enforce-module-boundaries` in `.eslintrc.base.json` to restrict dependencies:
  - Apps can only depend on core/shared
  - Core/shared should not depend on apps
  - No circular dependencies
- **Tag every project**: Ensure every app and package has both a `type` and `scope` tag in its project config.
- **Document tag meanings**: Keep a section in this doc or your README explaining each tag.

### Example ESLint Rule

```json
{
  "overrides": [
    {
      "files": ["*.ts", "*.tsx", "*.js", "*.jsx"],
      "rules": {
        "@nx/enforce-module-boundaries": [
          "error",
          {
            "enforceBuildableLibDependency": true,
            "allow": [],
            "depConstraints": [
              { "sourceTag": "type:app", "onlyDependOnLibsWithTags": ["type:core", "scope:shared"] },
              { "sourceTag": "type:core", "onlyDependOnLibsWithTags": ["type:core", "scope:shared"] },
              { "sourceTag": "scope:shared", "onlyDependOnLibsWithTags": ["scope:shared"] }
            ]
          }
        ]
      }
    }
  ]
}
```

---

## Workspace Generators

- **Custom Generators**: Already present for `library` and `app` creation.
- **Best Practices**:
  - Automate tag assignment and naming conventions
  - Scaffold README, config, and test files
  - Prompt for type/scope tags on creation
- **Future Addons**:
  - Generators for feature, UI, data-access, and util libraries
  - Automated dependency graph updates

---

## Actionable Recommendations

1. **Lock Down Module Boundaries**
   - Add and enforce `@nx/enforce-module-boundaries` in your root ESLint config
   - Define and document all tags in use
2. **Expand Use of Nx Plugins**
   - Add `@nx/graph` for visualizing dependencies
   - Consider `nx-cloud` for CI/CD caching
3. **Automate Tagging**
   - Update generators to require and validate tags
   - Add checks for missing or incorrect tags in CI
4. **Document Everything**
   - Keep this doc and your README up to date with all Nx conventions
5. **Review and Refactor**
   - Periodically review project boundaries and tags as the codebase evolves

---

## References

- [Nx Workspace Structure](https://nx.dev/blog/virtuous-cycle-of-workspace-structure)
- [Nx Module Boundaries](https://nx.dev/concepts/decisions/project-dependency-rules)
- [Nx Plugins](https://nx.dev/packages)
- [Nx Generators](https://nx.dev/core-features/generators/overview)
- [Nx Cloud](https://nx.app/)
- [Nx Graph](https://nx.dev/core-features/graph/overview)
