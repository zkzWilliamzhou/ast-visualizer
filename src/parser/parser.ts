/**
 * AST Parser Module
 * 
 * Uses acorn to parse JavaScript/TypeScript code into AST nodes.
 * Supports modern ECMAScript, TypeScript, JSX, and TSX syntax.
 */

import * as acorn from 'acorn';
import acornJsx from 'acorn-jsx';
import acornTypescript from 'acorn-typescript';

/**
 * Parser options for different language modes
 */
export interface ParseOptions {
  /** Language mode: 'js' | 'ts' | 'jsx' | 'tsx' */
  language?: 'js' | 'ts' | 'jsx' | 'tsx';
  /** ECMAScript version to parse */
  ecmaVersion?: number;
  /** Source type: 'module' | 'script' */
  sourceType?: 'module' | 'script';
  /** Include location info in AST nodes */
  locations?: boolean;
  /** Include range info (start/end indices) */
  ranges?: boolean;
  /** Allow return outside function */
  allowReturnOutsideFunction?: boolean;
  /** Allow await outside function */
  allowAwaitOutsideFunction?: boolean;
  /** Allow import/export everywhere */
  allowImportExportEverywhere?: boolean;
}

/**
 * Extended AST node with additional properties for visualization
 */
export interface ASTNode {
  type: string;
  start?: number;
  end?: number;
  loc?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  range?: [number, number];
  [key: string]: any;
}

/**
 * Parse result with metadata
 */
export interface ParseResult {
  ast: ASTNode;
  errors: ParseError[];
  language: string;
  sourceLength: number;
}

/**
 * Parse error interface
 */
export interface ParseErrorInfo {
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
}

/**
 * Create a parser with the appropriate plugins based on language
 */
function createParser(language: string) {
  let parser = acorn.Parser;

  switch (language) {
    case 'ts':
    case 'tsx':
      parser = parser.extend(acornTypescript as any);
      break;
    case 'jsx':
      parser = parser.extend(acornJsx as any);
      break;
  }

  return parser;
}

/**
 * Parse source code into AST
 * 
 * @param code - Source code to parse
 * @param options - Parser options
 * @returns ParseResult with AST and any errors
 */
export function parseAST(code: string, options: ParseOptions = {}): ASTNode {
  const {
    language = 'ts',
    ecmaVersion = 2022,
    sourceType = 'module',
    locations = true,
    ranges = true,
    allowReturnOutsideFunction = true,
    allowAwaitOutsideFunction = true,
    allowImportExportEverywhere = true,
  } = options;

  try {
    const Parser = createParser(language);
    
    const ast = Parser.parse(code, {
      ecmaVersion: ecmaVersion as any,
      sourceType,
      locations,
      ranges,
      allowReturnOutsideFunction,
      allowAwaitOutsideFunction,
      allowImportExportEverywhere,
      // Enable plugins for modern syntax
      // Note: plugins are handled by the parser extensions
    }) as ASTNode;

    return ast;
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Try to extract location info from acorn error
      const loc = (error as any).loc || { line: 1, column: 0 };
      throw new ParseError(
        `Parse error: ${error.message}`,
        loc.line,
        loc.column
      );
    }
    throw error;
  }
}

/**
 * Custom parse error class
 */
export class ParseError extends Error {
  public readonly line: number;
  public readonly column: number;
  public readonly severity: 'error' | 'warning' = 'error';

  constructor(message: string, line: number, column: number) {
    super(message);
    this.name = 'ParseError';
    this.line = line;
    this.column = column;
  }
}

/**
 * Walk the AST and apply a visitor function to each node
 * 
 * @param ast - Root AST node
 * @param visitor - Function called for each node
 * @param state - Optional state passed to visitor
 */
export function walkAST<T>(
  ast: ASTNode,
  visitor: (node: ASTNode, state: T) => void | boolean,
  state: T
): void {
  function walkNode(node: any, st: T) {
    if (node && typeof node === 'object' && node.type) {
      visitor(node as ASTNode, st);
    }
    for (const key of Object.keys(node)) {
      if (key === 'type' || key === 'loc' || key === 'range') continue;
      const value = node[key];
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === 'object' && item.type) {
              walkNode(item, st);
            }
          }
        } else if (value.type) {
          walkNode(value, st);
        }
      }
    }
  }
  walkNode(ast, state);
}

/**
 * Find nodes matching a predicate
 * 
 * @param ast - Root AST node
 * @param predicate - Function that returns true for matching nodes
 * @returns Array of matching nodes
 */
export function findNodes(ast: ASTNode, predicate: (node: ASTNode) => boolean): ASTNode[] {
  const results: ASTNode[] = [];
  
  function traverse(node: ASTNode) {
    if (predicate(node)) {
      results.push(node);
    }
    
    for (const key of Object.keys(node)) {
      if (key === 'type' || key === 'loc' || key === 'range') continue;
      
      const value = node[key];
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === 'object' && item.type) {
              traverse(item);
            }
          }
        } else if (value.type) {
          traverse(value);
        }
      }
    }
  }
  
  traverse(ast);
  return results;
}

/**
 * Get node at specific position (line/column)
 * 
 * @param ast - Root AST node
 * @param line - Line number (1-indexed)
 * @param column - Column number (0-indexed)
 * @returns The most specific node at that position, or null
 */
export function getNodeAtPosition(ast: ASTNode, line: number, column: number): ASTNode | null {
  let bestMatch: ASTNode | null = null;
  let bestSize = Infinity;

  function checkNode(node: ASTNode) {
    if (!node.loc) return;
    
    const startLine = node.loc.start.line;
    const startCol = node.loc.start.column;
    const endLine = node.loc.end.line;
    const endCol = node.loc.end.column;

    // Check if position is within this node
    const isWithin = (
      (line > startLine || (line === startLine && column >= startCol)) &&
      (line < endLine || (line === endLine && column <= endCol))
    );

    if (isWithin) {
      const size = (endLine - startLine) * 1000 + (endCol - startCol);
      if (size < bestSize) {
        bestSize = size;
        bestMatch = node;
      }
    }

    // Recurse into children
    for (const key of Object.keys(node)) {
      if (key === 'type' || key === 'loc' || key === 'range') continue;
      
      const value = node[key];
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === 'object' && item.type) {
              checkNode(item);
            }
          }
        } else if (value.type) {
          checkNode(value);
        }
      }
    }
  }

  checkNode(ast);
  return bestMatch;
}

/**
 * Get source text for a node
 * 
 * @param code - Original source code
 * @param node - AST node with loc/range info
 * @returns Source text for the node
 */
export function getNodeSource(code: string, node: ASTNode): string {
  if (node.range) {
    return code.slice(node.range[0], node.range[1]);
  }
  if (node.loc) {
    // Approximate from line/column (less accurate)
    const lines = code.split('\n');
    const startLine = node.loc.start.line - 1;
    const endLine = node.loc.end.line - 1;
    
    if (startLine === endLine) {
      return lines[startLine]?.slice(node.loc.start.column, node.loc.end.column) || '';
    }
    
    let result = lines[startLine]?.slice(node.loc.start.column) || '';
    for (let i = startLine + 1; i < endLine; i++) {
      result += '\n' + lines[i];
    }
    result += '\n' + (lines[endLine]?.slice(0, node.loc.end.column) || '');
    return result;
  }
  return '';
}