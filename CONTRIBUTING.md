# Contributing to AST Visualizer

Thank you for your interest in contributing to AST Visualizer! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Git

### Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/ast-visualizer.git
cd ast-visualizer

# Install dependencies
npm ci

# Start development server
npm run dev

# Run tests
npm test
```

## 🔄 Development Workflow

We follow a **Test-Driven Development (TDD)** approach:

1. **Write a failing test** (RED)
2. **Make it pass** (GREEN)
3. **Refactor** (REFACTOR)

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/improvements

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `test` - Tests
- `chore` - Maintenance

Examples:
```
feat(parser): add support for TS 5.2 decorators
fix(visualizer): handle circular references in AST
docs(readme): update installation instructions
test(utils): add permalink edge case tests
```

## 📏 Code Standards

### TypeScript

- **Strict mode enabled** - All code must pass `tsc --noEmit`
- **Explicit types** - Avoid `any`, use proper type definitions
- **JSDoc comments** - All public APIs must have JSDoc
- **No unused code** - `noUnusedLocals` and `noUnusedParameters` enforced

### Zero Dependencies Philosophy

Core modules (`parser`, `visualizer`, `utils`) must have **zero runtime dependencies**. Only devDependencies are allowed.

### Formatting & Linting

We use **Biome** for formatting and linting:

```bash
# Check formatting
npm run lint

# Auto-fix
npm run lint -- --write
```

### File Organization

```
src/
├── parser/          # AST parsing (acorn-based)
├── visualizer/      # AST → visualization conversion
└── utils/           # Permalinks, AI prompts
```

Each module has an `index.ts` for public exports.

## 🧪 Testing

### Test Framework

- **Vitest** - Fast, modern test runner
- **Coverage target**: 85%+ overall

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test tests/parser.test.ts

# Watch mode
npm test -- --watch
```

### Writing Tests

- Place tests in `tests/` directory
- Name files `*.test.ts`
- Use descriptive test names: `should <expected behavior> when <condition>`
- Test edge cases and error conditions
- Mock external dependencies

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { parseAST } from '../src/parser/parser';

describe('parseAST', () => {
  it('should parse arrow functions when language is js', () => {
    const code = 'const add = (a, b) => a + b;';
    const ast = parseAST(code, { language: 'js' });
    expect(ast.body[0].declarations[0].init.type).toBe('ArrowFunctionExpression');
  });
});
```

## 🔀 Pull Request Process

### Before Submitting

1. **Run all checks locally**:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm test
   ```

2. **Ensure your branch is up to date** with `main`

3. **Write/update tests** for your changes

4. **Update documentation** if needed

### PR Requirements

- [ ] All tests pass
- [ ] No linting errors
- [ ] TypeScript compiles without errors
- [ ] Coverage maintained or improved
- [ ] Commit messages follow conventions
- [ ] CHANGELOG.md updated (for significant changes)
- [ ] Documentation updated (if applicable)

### Review Process

1. **Automated checks** run on CI
2. **Code review** by maintainers
3. **Address feedback** - push new commits
4. **Approval** - requires 1 maintainer approval
5. **Merge** - squash and merge to main

### Review Criteria

- **Correctness** - Does it solve the problem?
- **Simplicity** - Is it the simplest solution?
- **Performance** - Any regressions?
- **Maintainability** - Clear, documented code?
- **Tests** - Adequate coverage?

## 📦 Release Process

Releases are automated via GitHub Actions:

1. **Merge to main** triggers build & test
2. **Version bump** via `npm version patch|minor|major`
3. **Tag push** triggers publish to npm
4. **GitHub Release** created automatically

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **PATCH** - Bug fixes, internal improvements
- **MINOR** - New features, backward compatible
- **MAJOR** - Breaking changes

## 🐛 Reporting Issues

### Bug Reports

Use the bug report template and include:

- **Environment** - OS, Node.js version, browser
- **Steps to reproduce** - Minimal code example
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)

### Feature Requests

Use the feature request template and describe:

- **Problem** - What problem does this solve?
- **Proposed solution** - How should it work?
- **Alternatives considered**
- **Additional context**

## 💬 Getting Help

- **Discussions** - [GitHub Discussions](https://github.com/workbuddy/ast-visualizer/discussions)
- **Issues** - [GitHub Issues](https://github.com/workbuddy/ast-visualizer/issues)
- **Discord** - [WorkBuddy Community](https://discord.gg/workbuddy) (coming soon)

## 🏆 Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Annual contributor highlights

---

**Thank you for contributing to AST Visualizer!** 🌳