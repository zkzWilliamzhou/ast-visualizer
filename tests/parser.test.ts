/**
 * Parser Tests
 * 
 * TDD: Tests written first (RED), then implementation makes them pass (GREEN)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parseAST, findNodes, getNodeSource, getNodeAtPosition, ParseError } from '../src/parser/parser';

describe('parseAST', () => {
  describe('JavaScript parsing', () => {
    it('should parse a simple function', () => {
      const code = 'function add(a, b) { return a + b; }';
      const ast = parseAST(code, { language: 'js' });
      
      expect(ast.type).toBe('Program');
      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe('FunctionDeclaration');
      expect(ast.body[0].id.name).toBe('add');
    });

    it('should parse arrow functions', () => {
      const code = 'const add = (a, b) => a + b;';
      const ast = parseAST(code, { language: 'js' });
      
      expect(ast.body[0].type).toBe('VariableDeclaration');
      expect(ast.body[0].declarations[0].init.type).toBe('ArrowFunctionExpression');
    });

    it('should parse classes', () => {
      const code = 'class Calculator { add(a, b) { return a + b; } }';
      const ast = parseAST(code, { language: 'js' });
      
      expect(ast.body[0].type).toBe('ClassDeclaration');
      expect(ast.body[0].id.name).toBe('Calculator');
    });

    it('should parse async/await', () => {
      const code = 'async function fetchData() { const data = await fetch("/api"); return data; }';
      const ast = parseAST(code, { language: 'js' });
      
      expect(ast.body[0].async).toBe(true);
      const awaitExpr = findNodes(ast, n => n.type === 'AwaitExpression');
      expect(awaitExpr).toHaveLength(1);
    });

    it('should parse destructuring', () => {
      const code = 'const { a, b } = obj;';
      const ast = parseAST(code, { language: 'js' });
      
      const declarator = ast.body[0].declarations[0];
      expect(declarator.id.type).toBe('ObjectPattern');
    });

    it('should parse template literals', () => {
      const code = 'const msg = `Hello ${name}!`;';
      const ast = parseAST(code, { language: 'js' });
      
      const template = findNodes(ast, n => n.type === 'TemplateLiteral');
      expect(template).toHaveLength(1);
    });
  });

  describe('TypeScript parsing', () => {
    it('should parse type annotations', () => {
      const code = 'function add(a: number, b: number): number { return a + b; }';
      const ast = parseAST(code, { language: 'ts' });
      
      expect(ast.body[0].type).toBe('FunctionDeclaration');
      // TypeScript adds type annotations
      expect(ast.body[0].params[0].typeAnnotation).toBeDefined();
    });

    it('should parse interfaces', () => {
      const code = 'interface User { name: string; age: number; }';
      const ast = parseAST(code, { language: 'ts' });
      
      expect(ast.body[0].type).toBe('TSInterfaceDeclaration');
      expect(ast.body[0].id.name).toBe('User');
    });

    it('should parse type aliases', () => {
      const code = 'type Point = { x: number; y: number; };';
      const ast = parseAST(code, { language: 'ts' });
      
      expect(ast.body[0].type).toBe('TSTypeAliasDeclaration');
    });

    it('should parse enums', () => {
      const code = 'enum Color { Red, Green, Blue }';
      const ast = parseAST(code, { language: 'ts' });
      
      expect(ast.body[0].type).toBe('TSEnumDeclaration');
    });

    it('should parse generics', () => {
      const code = 'function identity<T>(arg: T): T { return arg; }';
      const ast = parseAST(code, { language: 'ts' });
      
      expect(ast.body[0].type).toBe('FunctionDeclaration');
      expect(ast.body[0].typeParameters).toBeDefined();
    });
  });

  describe('JSX/TSX parsing', () => {
    it('should parse JSX elements', () => {
      const code = 'const element = <div>Hello</div>;';
      const ast = parseAST(code, { language: 'jsx' });
      
      const jsxElement = findNodes(ast, n => n.type === 'JSXElement');
      expect(jsxElement).toHaveLength(1);
    });

    it('should parse JSX with props', () => {
      const code = '<Component name="test" value={42} />';
      const ast = parseAST(code, { language: 'jsx' });
      
      const jsxElement = findNodes(ast, n => n.type === 'JSXElement')[0];
      expect(jsxElement.openingElement.attributes).toHaveLength(2);
    });

    it('should parse TSX with type annotations', () => {
      const code = 'const element: React.FC = <div />;';
      const ast = parseAST(code, { language: 'tsx' });
      
      expect(ast.body[0].declarations[0].id.typeAnnotation).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should throw ParseError for invalid syntax', () => {
      const code = 'function invalid( { return 1; }';
      
      expect(() => parseAST(code, { language: 'js' })).toThrow(ParseError);
    });

    it('should include line/column in parse error', () => {
      const code = 'const x = ;';
      
      try {
        parseAST(code, { language: 'js' });
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect(error.line).toBeGreaterThan(0);
        expect(error.column).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Source location tracking', () => {
    it('should include location info when enabled', () => {
      const code = 'function test() {}';
      const ast = parseAST(code, { language: 'js', locations: true });
      
      expect(ast.loc).toBeDefined();
      expect(ast.loc.start.line).toBe(1);
    });

    it('should include range info when enabled', () => {
      const code = 'function test() {}';
      const ast = parseAST(code, { language: 'js', ranges: true });
      
      expect(ast.range).toBeDefined();
      expect(ast.range[0]).toBe(0);
    });
  });
});

describe('findNodes', () => {
  it('should find all function declarations', () => {
    const code = `
      function a() {}
      function b() {}
      const c = () => {};
    `;
    const ast = parseAST(code, { language: 'js' });
    
    const functions = findNodes(ast, n => n.type.includes('Function'));
    expect(functions).toHaveLength(3);
  });

  it('should find nodes by type', () => {
    const code = 'const x = 1; const y = 2;';
    const ast = parseAST(code, { language: 'js' });
    
    const literals = findNodes(ast, n => n.type === 'Literal');
    expect(literals).toHaveLength(2);
  });

  it('should return empty array for no matches', () => {
    const code = 'const x = 1;';
    const ast = parseAST(code, { language: 'js' });
    
    const classes = findNodes(ast, n => n.type === 'ClassDeclaration');
    expect(classes).toHaveLength(0);
  });
});

describe('getNodeSource', () => {
  it('should extract source for a node', () => {
    const code = 'function add(a, b) { return a + b; }';
    const ast = parseAST(code, { language: 'js', ranges: true });
    
    const func = ast.body[0];
    const source = getNodeSource(code, func);
    
    expect(source).toBe('function add(a, b) { return a + b; }');
  });

  it('should extract source for nested nodes', () => {
    const code = 'const x = 1 + 2;';
    const ast = parseAST(code, { language: 'js', ranges: true });
    
    const binary = findNodes(ast, n => n.type === 'BinaryExpression')[0];
    const source = getNodeSource(code, binary);
    
    expect(source).toBe('1 + 2');
  });
});

describe('getNodeAtPosition', () => {
  it('should find node at specific position', () => {
    const code = 'function test() { return 42; }';
    const ast = parseAST(code, { language: 'js', locations: true });
    
    // Position inside the return statement
    const node = getNodeAtPosition(ast, 1, 20);
    
    expect(node).not.toBeNull();
    expect(node!.type).toBe('ReturnStatement');
  });

  it('should return null for invalid position', () => {
    const code = 'function test() {}';
    const ast = parseAST(code, { language: 'js', locations: true });
    
    const node = getNodeAtPosition(ast, 10, 10);
    expect(node).toBeNull();
  });
});