/**
 * AST Visualizer - Interactive browser-based AST visualization for JavaScript/TypeScript
 * 
 * A zero-dependency (runtime) tool for visualizing, exploring, and understanding
 * Abstract Syntax Trees. Designed for developers, educators, and AI prompt engineers.
 * 
 * @package ast-visualizer
 * @version 0.1.0
 * @license MIT
 */

import { parseAST, ParseOptions, ASTNode } from './parser/parser';
import { visualizeAST, VisualizerOptions, VisualizationData } from './visualizer/visualizer';
import { generatePermalink, parsePermalink } from './utils/permalink';
import { copyAsAIPrompt } from './utils/ai-prompt';

// Re-export types
export type { VisualizerNode, VisualizerEdge, VisualizationData, VisualizerOptions } from './visualizer/types';
export type { ParseOptions, ASTNode, ParseError } from './parser/parser';

// Re-export functions
export { parseAST, visualizeAST, generatePermalink, parsePermalink, copyAsAIPrompt };

// Main class for programmatic usage
export class ASTVisualizer {
  private code: string;
  private options: ParseOptions;

  constructor(code: string, options: ParseOptions = {}) {
    this.code = code;
    this.options = options;
  }

  parse(): ASTNode {
    return parseAST(this.code, this.options);
  }

  visualize(node: ASTNode, options?: VisualizerOptions): VisualizationData {
    return visualizeAST(node, options);
  }

  getAIPrompt(): string {
    const ast = this.parse();
    return copyAsAIPrompt(ast);
  }

  getPermalink(): string {
    const ast = this.parse();
    return generatePermalink(ast);
  }

  static fromCode(code: string, options?: ParseOptions): ASTVisualizer {
    return new ASTVisualizer(code, options);
  }
}

export default ASTVisualizer;