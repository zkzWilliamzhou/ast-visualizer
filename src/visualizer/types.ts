/**
 * Visualization Types
 * 
 * Type definitions for the AST visualization data structures.
 * Used for rendering tree views, graph views, and exporting data.
 */

/**
 * Node in the visualization tree/graph
 */
export interface VisualizerNode {
  /** Unique identifier for this node */
  id: string;
  /** AST node type (e.g., 'FunctionDeclaration', 'Identifier') */
  type: string;
  /** Human-readable label for display */
  label: string;
  /** Source code snippet this node represents */
  source?: string;
  /** Start position in source */
  start?: { line: number; column: number };
  /** End position in source */
  end?: { line: number; column: number };
  /** Child node IDs */
  children: string[];
  /** Parent node ID (null for root) */
  parent: string | null;
  /** Depth in tree (0 = root) */
  depth: number;
  /** Whether node is expanded in UI */
  expanded: boolean;
  /** Whether node is selected in UI */
  selected: boolean;
  /** Whether node matches current filter */
  matchesFilter: boolean;
  /** Node-specific metadata */
  meta?: Record<string, any>;
  /** Node category for coloring/grouping */
  category: NodeCategory;
}

/**
 * Edge connecting two nodes in graph view
 */
export interface VisualizerEdge {
  /** Unique edge ID */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Relationship type */
  relationship: EdgeRelationship;
  /** Property name on parent that references child */
  property?: string;
  /** Index if child is in an array */
  index?: number;
}

/**
 * Complete visualization data structure
 */
export interface VisualizationData {
  /** All nodes indexed by ID */
  nodes: Map<string, VisualizerNode>;
  /** All edges */
  edges: VisualizerEdge[];
  /** Root node ID */
  rootId: string;
  /** Total node count */
  nodeCount: number;
  /** Max tree depth */
  maxDepth: number;
  /** Source code that was parsed */
  sourceCode: string;
  /** Language mode */
  language: string;
}

/**
 * Node categories for visualization styling
 */
export type NodeCategory = 
  | 'statement'        // Statements (if, for, return, etc.)
  | 'declaration'      // Declarations (var, const, function, class)
  | 'expression'       // Expressions (call, binary, literal)
  | 'identifier'       // Identifiers and names
  | 'literal'          // Literal values (string, number, etc.)
  | 'keyword'          // Keywords (this, super, new)
  | 'pattern'          // Patterns (destructuring)
  | 'module'           // Import/export
  | 'type'             // TypeScript type annotations
  | 'jsx'              // JSX elements
  | 'comment'          // Comments
  | 'other';           // Everything else

/**
 * Edge relationship types
 */
export type EdgeRelationship = 
  | 'child'           // Direct child in AST
  | 'property'        // Named property on parent
  | 'array-element'   // Element in array property
  | 'reference';      // Cross-reference (e.g., identifier to declaration)

/**
 * Visualizer configuration options
 */
export interface VisualizerOptions {
  /** Include source code snippets in nodes */
  includeSource?: boolean;
  /** Max source snippet length */
  maxSourceLength?: number;
  /** Filter function for nodes */
  filter?: (node: VisualizerNode) => boolean;
  /** Initial expanded state for node types */
  expandTypes?: string[];
  /** Collapse types by default */
  collapseTypes?: string[];
  /** Node ID to center on */
  centerNodeId?: string;
}

/**
 * Export formats for visualization
 */
export type ExportFormat = 'svg' | 'png' | 'json' | 'dot' | 'mermaid';

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  /** Include filtered-out nodes */
  includeFiltered?: boolean;
  /** Theme for visual exports */
  theme?: 'light' | 'dark';
  /** Canvas dimensions */
  width?: number;
  height?: number;
}

/**
 * Permalink data structure
 */
export interface PermalinkData {
  /** Encoded AST data */
  ast: string;
  /** Visualizer options */
  options: VisualizerOptions;
  /** Viewport state */
  viewport?: {
    x: number;
    y: number;
    zoom: number;
    centerNodeId?: string;
  };
  /** Timestamp */
  timestamp: number;
  /** Version */
  version: string;
}

/**
 * UI state for the visualizer
 */
export interface VisualizerUIState {
  /** Currently selected node ID */
  selectedNodeId: string | null;
  /** Filtered node types */
  filteredTypes: Set<string>;
  /** Search query */
  searchQuery: string;
  /** View mode */
  viewMode: 'tree' | 'graph' | 'split';
  /** Show source code panel */
  showSource: boolean;
  /** Show metadata panel */
  showMetadata: boolean;
  /** Zoom level */
  zoom: number;
  /** Pan offset */
  pan: { x: number; y: number };
}