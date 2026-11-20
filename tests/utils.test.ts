/**
 * Utility Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generatePermalink, parsePermalink, isValidPermalink, getPermalinkMetadata, copyAsAIPrompt, generateSummaryPrompt } from '../src/utils';

describe('Permalink utilities', () => {
  let testAST: any;
  let testVisData: any;

  beforeEach(() => {
    // Create a simple test AST
    testAST = {
      type: 'Program',
      body: [
        {
          type: 'FunctionDeclaration',
          id: { type: 'Identifier', name: 'test' },
          params: [],
          body: { type: 'BlockStatement', body: [] },
        },
      ],
      sourceCode: 'function test() {}',
      language: 'javascript',
      loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 18 } },
      range: [0, 18],
    };
  });

  describe('generatePermalink', () => {
    it('should generate a valid permalink string', () => {
      const permalink = generatePermalink(testAST);
      
      expect(permalink).toBeDefined();
      expect(typeof permalink).toBe('string');
      expect(permalink.startsWith('#')).toBe(true);
    });

    it('should include options in permalink', () => {
      const options = { includeSource: true, maxSourceLength: 100 };
      const permalink = generatePermalink(testAST, options);
      
      const result = parsePermalink(permalink);
      expect(result).not.toBeNull();
      expect(result!.options.includeSource).toBe(true);
      expect(result!.options.maxSourceLength).toBe(100);
    });

    it('should include viewport when provided', () => {
      const viewport = { x: 100, y: 200, zoom: 1.5, centerNodeId: 'node_123' };
      const permalink = generatePermalink(testAST, {}, viewport);
      
      const result = parsePermalink(permalink);
      expect(result!.viewport).toEqual(viewport);
    });

    it('should include timestamp', () => {
      const permalink = generatePermalink(testAST);
      const result = parsePermalink(permalink);
      
      expect(result).not.toBeNull();
      expect(typeof result!.timestamp).toBe('number');
      expect(result!.timestamp).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('parsePermalink', () => {
    it('should parse a valid permalink', () => {
      const permalink = generatePermalink(testAST);
      const result = parsePermalink(permalink);
      
      expect(result).not.toBeNull();
      expect(result!.data).toBeDefined();
      expect(result!.data.nodes).toBeInstanceOf(Map);
      expect(result!.data.rootId).toBeDefined();
    });

    it('should handle permalink with or without # prefix', () => {
      const permalink = generatePermalink(testAST);
      const withHash = parsePermalink(permalink);
      const withoutHash = parsePermalink(permalink.slice(1));
      
      expect(withHash).not.toBeNull();
      expect(withoutHash).not.toBeNull();
      expect(withHash!.data.rootId).toBe(withoutHash!.data.rootId);
    });

    it('should return null for invalid permalink', () => {
      const result = parsePermalink('#invalid');
      expect(result).toBeNull();
    });

    it('should return null for malformed base64', () => {
      const result = parsePermalink('#not-base64!!!');
      expect(result).toBeNull();
    });

    it('should return null for wrong version', () => {
      // Manually create a permalink with wrong version
      const data = {
        ast: JSON.stringify({ nodes: [], edges: [], rootId: 'test', nodeCount: 0, maxDepth: 0, sourceCode: '', language: 'js' }),
        options: {},
        timestamp: Date.now(),
        version: '0.9',
      };
      const encoded = btoa(JSON.stringify(data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const result = parsePermalink('#' + encoded);
      
      expect(result).toBeNull();
    });
  });

  describe('isValidPermalink', () => {
    it('should return true for valid permalink', () => {
      const permalink = generatePermalink(testAST);
      expect(isValidPermalink(permalink)).toBe(true);
    });

    it('should return false for invalid permalink', () => {
      expect(isValidPermalink('#invalid')).toBe(false);
      expect(isValidPermalink('')).toBe(false);
      expect(isValidPermalink('#')).toBe(false);
    });
  });

  describe('getPermalinkMetadata', () => {
    it('should extract metadata without full parsing', () => {
      const permalink = generatePermalink(testAST);
      const meta = getPermalinkMetadata(permalink);
      
      expect(meta).not.toBeNull();
      expect(meta!.version).toBe('1.0');
      expect(typeof meta!.timestamp).toBe('number');
      expect(typeof meta!.nodeCount).toBe('number');
      expect(typeof meta!.language).toBe('string');
    });

    it('should return null for invalid permalink', () => {
      const meta = getPermalinkMetadata('#invalid');
      expect(meta).toBeNull();
    });
  });
});

describe('AI Prompt utilities', () => {
  let testAST: any;
  let testSourceCode: string;

  beforeEach(() => {
    testSourceCode = `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

class Calculator {
  constructor(initialValue = 0) {
    this.value = initialValue;
  }

  add(n) {
    this.value += n;
    return this;
  }
}

import { helper } from './utils';
export { fibonacci, Calculator };
`;
    
    testAST = {
      type: 'Program',
      body: [
        {
          type: 'FunctionDeclaration',
          id: { type: 'Identifier', name: 'fibonacci' },
          params: [{ type: 'Identifier', name: 'n' }],
          body: {
            type: 'BlockStatement',
            body: [
              { type: 'IfStatement', test: { type: 'BinaryExpression', operator: '<=', left: { type: 'Identifier', name: 'n' }, right: { type: 'Literal', value: 1 } }, consequent: { type: 'ReturnStatement', argument: { type: 'Identifier', name: 'n' } } },
              { type: 'ReturnStatement', argument: { type: 'CallExpression', callee: { type: 'Identifier', name: 'fibonacci' } } }
            ]
          }
        },
        {
          type: 'ClassDeclaration',
          id: { type: 'Identifier', name: 'Calculator' },
          body: {
            type: 'ClassBody',
            body: [
              { type: 'MethodDefinition', kind: 'constructor', key: { type: 'Identifier', name: 'constructor' } },
              { type: 'MethodDefinition', kind: 'method', key: { type: 'Identifier', name: 'add' } }
            ]
          }
        },
        { type: 'ImportDeclaration', source: { type: 'Literal', value: './utils' } },
        { type: 'ExportNamedDeclaration' }
      ],
      sourceCode: testSourceCode,
      language: 'javascript',
    };
  });

  describe('copyAsAIPrompt', () => {
    it('should generate a structured prompt', () => {
      const prompt = copyAsAIPrompt(testAST, testSourceCode);
      
      expect(prompt).toContain('# Code Structure for AI Analysis');
      expect(prompt).toContain('## Overview');
      expect(prompt).toContain('## Key Structures');
    });

    it('should include functions section', () => {
      const prompt = copyAsAIPrompt(testAST, testSourceCode);
      
      expect(prompt).toContain('### Functions');
      expect(prompt).toContain('fibonacci');
    });

    it('should include classes section', () => {
      const prompt = copyAsAIPrompt(testAST, testSourceCode);
      
      expect(prompt).toContain('### Classes');
      expect(prompt).toContain('Calculator');
    });

    it('should include imports/exports section', () => {
      const prompt = copyAsAIPrompt(testAST, testSourceCode);
      
      expect(prompt).toContain('### Imports');
      expect(prompt).toContain('### Exports');
    });

    it('should include full source code', () => {
      const prompt = copyAsAIPrompt(testAST, testSourceCode);
      
      expect(prompt).toContain('## Full Source Code');
      expect(prompt).toContain('function fibonacci');
    });

    it('should truncate very long source code', () => {
      const longCode = 'x\n'.repeat(300);
      const longAST = { ...testAST, sourceCode: longCode };
      const prompt = copyAsAIPrompt(longAST, longCode);
      
      expect(prompt).toContain('more lines');
    });
  });

  describe('generateSummaryPrompt', () => {
    it('should generate a quick summary', () => {
      const summary = generateSummaryPrompt(testAST, testSourceCode);
      
      expect(summary).toContain('## Quick Code Summary');
      expect(summary).toContain('Lines:');
      expect(summary).toContain('Functions:');
      expect(summary).toContain('Classes:');
      expect(summary).toContain('Imports:');
      expect(summary).toContain('Exports:');
      expect(summary).toContain('Estimated Complexity:');
    });

    it('should estimate complexity', () => {
      const simpleAST = { type: 'Program', body: [], sourceCode: 'const x = 1;', language: 'js' };
      const simpleSummary = generateSummaryPrompt(simpleAST, 'const x = 1;');
      expect(simpleSummary).toContain('low');
    });
  });
});