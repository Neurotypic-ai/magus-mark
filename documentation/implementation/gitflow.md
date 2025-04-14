# Git Workflow

This document outlines the Git workflow and branching strategy for the Obsidian Magic project.

## Branching Strategy

Obsidian Magic follows a simplified GitFlow branching strategy with the following branch types:

### Main Branches

- **main**: The primary branch that reflects the production-ready state of the codebase. All releases are tagged from this branch.
- **develop**: The integration branch where features, fixes, and improvements are merged before being released.

### Supporting Branches

- **feature/\***: Created from `develop` for developing new features or enhancements.
- **bugfix/\***: Created from `develop` for fixing bugs that aren't critical.
- **hotfix/\***: Created from `main` for fixing critical bugs in the production environment.
- **release/\***: Created from `develop` when preparing a new release, used for final testing and minor fixes.
- **docs/\***: Created from `develop` for documentation updates.
- **chore/\***: Created from `develop` for maintenance tasks, dependency updates, or tooling changes.

## Branch Naming Conventions

Branches should follow the convention: `<type>/<issue-number>-<short-description>`

Examples:
- `feature/123-add-tag-suggestions`
- `bugfix/456-fix-markdown-parser`
- `hotfix/789-critical-security-fix`
- `docs/234-update-api-docs`
- `chore/345-update-dependencies`

## Commit Message Guidelines

Obsidian Magic follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. This enables automatic changelog generation and version bumping.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries

### Scope

The scope should be the name of the package or module affected (e.g., `core`, `tagging`, `ui`, `cli`).

### Examples

```
feat(tagging): add support for nested hierarchical tags

This change introduces a new tagging format that allows for hierarchical 
organization using nested structure.

BREAKING CHANGE: The tag parser API has changed to support the new format.
```

```
fix(core): ensure proper error handling for file operations

Resolves #456
```

```
chore(deps): update TypeScript to v5.0.4
```

## Pull Request Process

### Opening a Pull Request

1. Create a branch following the branching strategy and naming conventions.
2. Make your changes, following the code quality standards.
3. Push your branch to the remote repository.
4. Open a pull request against the appropriate target branch (`develop` for most changes, `main` for hotfixes).
5. Fill out the pull request template with the required information.

### Pull Request Template

```markdown
## Description
[Provide a brief description of the changes in this pull request]

## Related Issues
[Link to any related issues, e.g., "Fixes #123"]

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement
- [ ] Test changes
- [ ] Build/dependency changes

## Testing
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] Existing tests pass locally with my changes

## Screenshots (if applicable)
[Add screenshots here if relevant]

## Checklist
- [ ] My code follows the code style of this project
- [ ] I have updated the documentation accordingly
- [ ] I have added tests to cover my changes
- [ ] All new and existing tests passed
- [ ] My changes generate no new warnings
- [ ] I have checked for potential breaking changes and addressed them
```

### Pull Request Reviews

1. At least one approval is required before merging a pull request.
2. The reviewer should check for:
   - Code quality and adherence to project standards
   - Test coverage
   - Documentation updates
   - Performance impacts
   - Security implications
3. Feedback should be constructive and specific.
4. Use GitHub's review features to comment on specific lines of code.

### Merging Pull Requests

1. All required checks must pass before merging.
2. Pull requests should be up-to-date with the target branch before merging.
3. Use the "Squash and merge" option for feature branches to maintain a clean history.
4. Use the "Merge commit" option for release branches to preserve the branch history.
5. Delete the branch after merging.

## Release Process

### Preparing a Release

1. Create a `release/<version>` branch from `develop`.
2. Update version numbers in package.json files.
3. Update the CHANGELOG.md with the new version's changes.
4. Make any final adjustments, such as fixing minor issues discovered during QA.
5. Open a pull request from the release branch to `main`.
6. Once approved and merged, tag the commit on `main` with the version number.
7. Merge `main` back into `develop` to ensure all release changes are propagated.

### Release Versioning

Obsidian Magic follows [Semantic Versioning](https://semver.org/) (SemVer) for version numbers.

- **Major version** (X.0.0): Incompatible API changes.
- **Minor version** (0.X.0): Backwards-compatible functionality additions.
- **Patch version** (0.0.X): Backwards-compatible bug fixes.

### Hotfix Process

1. Create a `hotfix/<issue>-<description>` branch from `main`.
2. Make the necessary fixes.
3. Increment the patch version.
4. Update the CHANGELOG.md.
5. Open a pull request to `main`.
6. Once merged, tag the commit on `main` with the new version number.
7. Open a pull request to merge the changes back into `develop`.

## Git Hooks and CI/CD Integration

### Pre-commit Hooks

Obsidian Magic uses pre-commit hooks to ensure code quality:

- Linting via ESLint
- Code formatting via Prettier
- Type checking via TypeScript
- Test running for affected files

### CI/CD Pipelines

The CI/CD pipeline performs the following checks on pull requests:

1. Build the project
2. Run all tests
3. Check code coverage
4. Lint the code
5. Type check the code
6. Run security scans on dependencies

For merges to `main`:

1. Execute the PR checks
2. Generate documentation
3. Create a release tag
4. Publish packages (if applicable)

## Git Best Practices

### Keep Branches Short-lived

Feature branches should be short-lived and focused on a specific task. Aim to complete and merge branches within a few days to avoid merge conflicts.

### Rebase vs. Merge

- Use rebase when updating your feature branch with changes from the target branch.
- Use merge when integrating a completed feature into the target branch.

### Commit Frequently

Make small, focused commits that address a single concern. This makes it easier to understand changes, review code, and revert if necessary.

### Keep Commits Atomic

Each commit should represent a single logical change. This makes it easier to understand the history, cherry-pick changes, and revert if necessary.

### Write Meaningful Commit Messages

Follow the Conventional Commits specification and provide detailed descriptions of changes in the commit body when necessary.

### Push Regularly

Push your changes to the remote repository regularly to back up your work and allow for collaboration.

### Fetch and Update Regularly

Regularly fetch and update your branches with changes from the remote repository to stay in sync with the team and avoid large merge conflicts.

## Git Configuration

### Recommended Git Configuration

```bash
# Configure your identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set default branch to main
git config --global init.defaultBranch main

# Set up diff and merge tools
git config --global merge.tool vscode
git config --global mergetool.vscode.cmd 'code --wait $MERGED'
git config --global diff.tool vscode
git config --global difftool.vscode.cmd 'code --wait --diff $LOCAL $REMOTE'

# Enable helpful aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'
```

### Useful Git Aliases for the Project

Consider adding these aliases to your shell configuration:

```bash
# Show a concise log with a graph
alias glog="git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"

# Show the status of the feature branch compared to develop
alias gbs="git branch-status"
```

## Git Resources

### Learning Resources

- [Pro Git Book](https://git-scm.com/book/en/v2)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [GitFlow](https://nvie.com/posts/a-successful-git-branching-model/)

### Tools

- [GitHub Desktop](https://desktop.github.com/)
- [GitKraken](https://www.gitkraken.com/)
- [Sourcetree](https://www.sourcetreeapp.com/)
- [VS Code Git Integration](https://code.visualstudio.com/docs/editor/versioncontrol)

## Conclusion

Following this Git workflow will help maintain a clean and organized repository, facilitate collaboration, and ensure a stable codebase for Obsidian Magic. This workflow is designed to be flexible and can be adjusted as the project evolves. 