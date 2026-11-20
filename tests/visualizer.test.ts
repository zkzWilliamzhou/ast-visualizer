/**
 * Visualizer Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { visualizeAST, applyFilter, findNodeById, getPathToNode, getNodesAtDepth, getSubtree, exportToDOT, exportToMermaid, exportToJSON, resetNodeIdCounter } from '../src/visualizer/visualizer';
import { parseAST } from '../src/parser/parser';

describe('visualizeAST', () => {
  beforeEach(() => {
    resetNodeIdCounter();
  });

  it('should create visualization data from simple function', () => {
    const code = 'function add(a, b) { return a + b; }';
    const ast = parseAST(code, { language: 'js' });
    const visData = visualizeAST(ast);
    
    expect(visData.nodes.size).toBeGreaterThan(0);
    expect(visData.edges.length).toBeGreaterThan(0);
    expect(visData.rootId).toBeDefined();
    expect(visData.nodeCount).toBe(visData.nodes.size);
    expect(visData.maxDepth).toBeGreaterThan(0);
    expect(visData.sourceCode).toBe(code);
  });

  it('should categorize nodes correctly', () => {
    const code = 'const x = 1;';
    const ast = parseAST(code, { language: 'js' });
    const visData = visualizeAST(ast);
    
    // Check that nodes have categories
    for (const node of visData.nodes.values()) {
      expect(node.category).toBeDefined();
      expect(['statement', 'declaration', 'expression', 'identifier', 'literal', 'keyword', 'pattern', 'module', 'type', 'jsx', 'comment', 'other']).toContain(node.category);
    }
  });

  it('should create proper parent-child relationships', () => {
    const code = 'function test() { return 42; }';
    const ast = parseAST(code, { language: 'js' });
    const visData = visualizeAST(ast);
    
    const funcNode = Array.from(visData.nodes.values()).find(n => n.type === 'FunctionDeclaration');
    expect(funcNode).toBeDefined();
    expect(funcNode!.children.length).toBeGreaterThan(0);
    
    // Children should have parent reference
    for (const childId of funcNode!.children) {
      const child = visData.nodes.get(childId);
      expect(child?.parent).toBe(funcNode!.id);
    }
  });

  it('should include source snippets when enabled', () => {
    const code = 'function test() { return 42; }';
    const ast = parseAST(code, { language: 'js' });
    const visData = visualizeAST(ast, { includeSource: true, maxSourceLength: 50 });
    
    for (const node of visData.nodes.values()) {
      if (node.source) {
        expect(node.source.length).toBeLessThanOrEqual(53); // 50 + '...'
      }
    }
  });

  it('should expand nodes by default for shallow depth', () => {
    const code = 'function test() { return 42; }';
    const ast = parseAST(code, { language: 'js' });
    const visData = visualizeAST(ast);
    
    const funcNode = Array.from(visData.nodes.values()).find(n => n.type === 'FunctionDeclaration');
    expect(funcNode?.expanded).toBe(true);
  });

  it('should respect expandTypes option', () => {
    const code = 'function test() { if (true) { return 1; } }';
    const ast = parseAST(code, { language: 'js' });
    const visData = visualizeAST(ast, { expandTypes: ['IfStatement'] });
    
    const ifNode = Array.from(visData.nodes.values()).find(n => n.type === 'IfStatement');
    expect(ifNode?.expanded).toBe(true);
  });

  it('should respect collapseTypes option', () => {
    const code = 'function test() { return 42; }';
    const ast = parseAST(code, { language: 'js' });
    const visData = visualizeAST(ast, { collapseTypes: ['FunctionDeclaration'] });
    
    const funcNode = Array.from(visData.nodes.values()).find(n => n.type === 'FunctionDeclaration');
    expect(funcNode?.expanded).toBe(false);
  });
});

describe('applyFilter', () => {
  let visData: ReturnType<typeof visualizeAST>;

  beforeEach(() => {
    resetNodeIdCounter();
    const code = 'function test() { const x = 1; if (x) { return x; } }';
    const ast = parseAST(code, { language: 'js' });
    visData = visualizeAST(ast);
  });

  it('should filter nodes by type', () => {
    const filtered = applyFilter(visData, node => node.category === 'declaration');
    
    // Should have some nodes matching
    const matches = Array.from(filtered.nodes.values()).filter(n => n.matchesFilter);
    expect(matches.length).toBeGreaterThan(0);
    
    // Non-matching nodes should have matchesFilter = false
    const nonMatches = Array.from(filtered.nodes.values()).filter(n => !n.matchesFilter);
    expect(nonMatches.length).toBeGreaterThan(0);
  });

  it('should keep parents of matching children visible', () => {
    const filtered = applyFilter(visData, node => node.type === 'Literal');
    
    const literalNodes = Array.from(filtered.nodes.values()).filter(n => n.type === 'Literal');
    expect(literalNodes.length).toBeGreaterThan(0);
    
    // Parent of literal (VariableDeclarator) should be visible
    for (const lit of literalNodes) {
      if (lit.parent) {
        const parent = filtered.nodes.get(lit.parent);
        expect(parent?.matchesFilter).toBe(true);
      }
    }
  });

  it('should filter by search term on label', () => {
    const filtered = applyFilter(visData, node => node.label.toLowerCase().includes('test'));
    
    const matches = Array.from(filtered.nodes.values()).filter(n => n.matchesFilter);
    expect(matches.some(n => n.label.includes('test'))).toBe(true);
  });
});

describe('findNodeById', () => {
  let visData: ReturnType<typeof visualizeAST>;

  beforeEach(() => {
    resetNodeIdCounter();
    const code = 'function test() {}';
    const ast = parseAST(code, { language: 'js' });
    visData = visualizeAST(ast);
  });

  it('should find existing node', () => {
    const rootNode = visData.nodes.get(visData.rootId);
    expect(rootNode).toBeDefined();
    
    const found = findNodeById(visData, visData.rootId);
    expect(found).toBe(rootNode);
  });

  it('should return undefined for non-existent node', () => {
    const found = findNodeById(visData, 'non-existent-id');
    expect(found).toBeUndefined();
  });
});

describe('getPathToNode', () => {
  let visData: ReturnType<typeof visualizeAST>;

  beforeEach(() => {
    resetNodeIdCounter();
    const code = 'function test() { return 42; }';
    const ast = parseAST(code, { language: 'js' });
    visData = visualizeAST(ast);
  });

  it('should return path from root to node', () => {
    const literal = Array.from(visData.nodes.values()).find(n => n.type === 'Literal');
    expect(literal).toBeDefined();
    
    const path = getPathToNode(visData, literal!.id);
    expect(path.length).toBeGreaterThan(1);
    expect(path[0].id).toBe(visData.rootId);
    expect(path[path.length - 1].id).toBe(literal!.id);
  });

  it('should return single node for root', () => {
    const path = getPathToNode(visData, visData.rootId);
    expect(path).toHaveLength(1);
    expect(path[0].id).toBe(visData.rootId);
  });
});

describe('getNodesAtDepth', () => {
  let visData: ReturnType<typeof visualizeAST>;

  beforeEach(() => {
    resetNodeIdCounter();
    const code = 'function test() { const x = 1; return x; }';
    const ast = parseAST(code, { language: 'js' });
    visData = visualizeAST(ast);
  });

  it('should return nodes at specific depth', () => {
    const depth0 = getNodesAtDepth(visData, 0);
    expect(depth0).toHaveLength(1);
    expect(depth0[0].id).toBe(visData.rootId);
    
    const depth1 = getNodesAtDepth(visData, 1);
    expect(depth1.length).toBeGreaterThan(0);
  });

  it('should return empty array for depth beyond max', () => {
    const nodes = getNodesAtDepth(visData, 100);
    expect(nodes).toHaveLength(0);
  });
});

describe('getSubtree', () => {
  let visData: ReturnType<typeof visualizeAST>;

  beforeEach(() => {
    resetNodeIdCounter();
    const code = 'function test() { if (true) { return 1; } return 2; }';
    const ast = parseAST(code, { language: 'js' });
    visData = visualizeAST(ast);
  });

  it('should extract subtree rooted at node', () => {
    const ifNode = Array.from(visData.nodes.values()).find(n => n.type === 'IfStatement');
    expect(ifNode).toBeDefined();
    
    const subtree = getSubtree(visData, ifNode!.id);
    expect(subtree.rootId).toBe(ifNode!.id);
    expect(subtree.nodes.size).toBeLessThan(visData.nodes.size);
    expect(subtree.edges.length).toBeLessThanOrEqual(visData.edges.length);
  });

  it('should include all descendants', () => {
    const ifNode = Array.from(visData.nodes.values()).find(n => n.type === 'IfStatement');
    const subtree = getSubtree(visData, ifNode!.id);
    
    // Should include the return statement inside the if
    const returnInIf = Array.from(subtree.nodes.values()).find(n => n.type === 'ReturnStatement');
    expect(returnInIf).toBeDefined();
  });
});

describe('Export functions', () => {
  let visData: ReturnType<typeof visualizeAST>;

  beforeEach(() => {
    resetNodeIdCounter();
    const code = 'function test() { return 42; }';
    const ast = parseAST(code, { language: 'js' });
    visData = visualizeAST(ast);
  });

  it('should export to DOT format', () => {
    const dot = exportToDOT(visData);
    
    expect(dot).toContain('digraph AST');
    expect(dot).toContain('rankdir=TB');
    expect(dot).toContain('test');
  });

  it('should export to Mermaid format', () => {
    const mermaid = exportToMermaid(visData);
    
    expect(mermaid).toContain('graph TD');
    expect(mermaid).toContain('test');
  });

  it('should export to JSON', () => {
    const json = exportToJSON(visData);
    const parsed = JSON.parse(json);
    
    expect(parsed.nodes).toBeDefined();
    expect(parsed.edges).toBeDefined();
    expect(parsed.rootId).toBe(visData.rootId);
    expect(parsed.nodeCount).toBe(visData.nodeCount);
  });
});