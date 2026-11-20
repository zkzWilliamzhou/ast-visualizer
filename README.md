# AST Visualizer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen.svg)](https://github.com/workbuddy/ast-visualizer)

> **Interactive, browser-based AST visualization and exploration tool for JavaScript/TypeScript**

AST Visualizer helps developers understand, debug, and communicate code structure by transforming Abstract Syntax Trees into interactive visualizations. Built for developers, educators, and AI prompt engineers.

## ✨ Features

- 🌳 **Interactive Tree View** - Expand/collapse nodes, filter by type, search by name
- 🔗 **Shareable Permalinks** - Generate URL-safe links to share exact AST views
- 🤖 **AI-Optimized Prompts** - Copy structured code summaries for LLM consumption
- 📦 **Zero Runtime Dependencies** - Core parser & visualizer have zero dependencies
- 🎨 **Multi-Language Support** - JavaScript, TypeScript, JSX, TSX
- 📤 **Multiple Export Formats** - JSON, DOT (Graphviz), Mermaid
- 🌙 **Dark/Light Theme** - Automatic system preference detection
- ⌨️ **Keyboard Accessible** - Full keyboard navigation support
- 📱 **Responsive Design** - Works on desktop and mobile

## 🚀 Quick Start

### Online Demo
Visit the live demo: [ast-visualizer.vercel.app](https://ast-visualizer.vercel.app) (coming soon)

### Local Development

```bash
# Clone the repository
git clone https://github.com/workbuddy/ast-visualizer.git
cd ast-visualizer

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### As a Library

```bash
npm install ast-visualizer
```

```typescript
import { ASTVisualizer, parseAST, visualizeAST, copyAsAIPrompt } from 'ast-visualizer';

// Programmatic usage
const visualizer = new ASTVisualizer(`
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
`, { language: 'js' });

const ast = visualizer.parse();
const visualization = visualizer.visualize(ast);
const aiPrompt = visualizer.getAIPrompt();
const permalink = visualizer.getPermalink();
```

## 📖 Usage Guide

### Web Interface

1. **Paste Code** - Enter JavaScript/TypeScript in the left editor
2. **Select Language** - Choose JS, TS, JSX, or TSX from dropdown
3. **Explore AST** - Click nodes to expand/collapse, use search/filter
4. **Share** - Click "Share" to generate a permalink
5. **Export** - Click "Export" to download as JSON, DOT, or Mermaid
6. **AI Prompt** - Click "Copy AI Prompt" for LLM-optimized code summary

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Parse code |
| `Ctrl/Cmd + S` | Share visualization |
| `Escape` | Close modals |
| `Arrow Keys` | Navigate tree |
| `Enter/Space` | Toggle node / Select node |

### Programmatic API

```typescript
import { parseAST, visualizeAST, generatePermalink, parsePermalink, copyAsAIPrompt } from 'ast-visualizer';

// Parse code to AST
const ast = parseAST(code, { language: 'ts' });

// Convert AST to visualization data
const visData = visualizeAST(ast, {
  includeSource: true,
  maxSourceLength: 150,
  expandTypes: ['FunctionDeclaration', 'ClassDeclaration'],
  collapseTypes: ['BlockStatement'],
});

// Generate shareable permalink
const permalink = generatePermalink(ast, options, viewport);

// Parse permalink back to visualization
const restored = parsePermalink(permalink);

// Generate AI-optimized prompt
const prompt = copyAsAIPrompt(ast, sourceCode, focusNodeId);
```

## 🏗️ Architecture

```
ast-visualizer/
├── src/
│   ├── index.ts                 # Main entry point & ASTVisualizer class
│   ├── parser/
│   │   ├── parser.ts            # Acorn-based parser (JS/TS/JSX/TSX)
│   │   └── index.ts
│   ├── visualizer/
│   │   ├── types.ts             # TypeScript types for visualization
│   │   ├── visualizer.ts        # AST → visualization conversion
│   │   └── index.ts
│   └── utils/
│       ├── permalink.ts         # Shareable URL generation/parsing
│       ├── ai-prompt.ts         # AI-optimized prompt generation
│       └── index.ts
├── tests/                       # Vitest test suite
├── index.html                   # Web interface
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Core Modules

| Module | Description | Dependencies |
|--------|-------------|--------------|
| `parser` | Acorn-based parser with TS/JSX support | `acorn`, `acorn-typescript`, `acorn-jsx`, `acorn-walk` |
| `visualizer` | AST → interactive tree/graph conversion | None (zero deps) |
| `utils/permalink` | Base64URL encoding for shareable links | None |
| `utils/ai-prompt` | Structured prompt generation for LLMs | None |

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test tests/parser.test.ts
```

### Test Coverage Goals
- Parser: 90%+
- Visualizer: 85%+
- Utilities: 90%+

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests first (TDD)
4. Implement feature
5. Ensure all tests pass
6. Submit a Pull Request

### Code Standards
- TypeScript strict mode
- Zero runtime dependencies for core modules
- Comprehensive JSDoc comments
- Conventional commits
- Biome for formatting/linting

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Acorn](https://github.com/acornjs/acorn) - JavaScript parser
- [TypeScript](https://github.com/microsoft/TypeScript) - Type definitions
- [Vite](https://vitejs.dev/) - Build tool
- [Vitest](https://vitest.dev/) - Testing framework

## 🔗 Links

- [GitHub Repository](https://github.com/workbuddy/ast-visualizer)
- [Issue Tracker](https://github.com/workbuddy/ast-visualizer/issues)
- [Discussions](https://github.com/workbuddy/ast-visualizer/discussions)

---

**Made with ❤️ by the WorkBuddy team**