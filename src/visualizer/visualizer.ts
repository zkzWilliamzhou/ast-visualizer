/**
 * AST Visualizer Module
 * 
 * Converts AST nodes into visualization data structures
 * for tree views, graph views, and export formats.
 */

import { ASTNode, getNodeSource } from '../parser/parser';
import {
  VisualizerNode,
  VisualizerEdge,
  VisualizationData,
  VisualizerOptions,
  NodeCategory,
  EdgeRelationship,
} from './types';

let nodeIdCounter = 0;

/**
 * Generate unique node ID
 */
function generateNodeId(): string {
  return `node_${++nodeIdCounter}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Reset node ID counter (for testing)
 */
export function resetNodeIdCounter(): void {
  nodeIdCounter = 0;
}

/**
 * Categorize an AST node type for visualization
 */
function categorizeNode(type: string): NodeCategory {
  // Statements
  if (type.endsWith('Statement') || 
      ['BlockStatement', 'SwitchStatement', 'TryStatement', 'CatchClause'].includes(type)) {
    return 'statement';
  }
  
  // Declarations
  if (type.endsWith('Declaration') || 
      ['VariableDeclarator', 'FunctionDeclaration', 'ClassDeclaration'].includes(type)) {
    return 'declaration';
  }
  
  // Expressions
  if (type.endsWith('Expression') || 
      ['CallExpression', 'NewExpression', 'MemberExpression', 'BinaryExpression', 
       'LogicalExpression', 'ConditionalExpression', 'SequenceExpression'].includes(type)) {
    return 'expression';
  }
  
  // Identifiers
  if (type === 'Identifier' || type === 'PrivateIdentifier') {
    return 'identifier';
  }
  
  // Literals
  if (type.endsWith('Literal') || 
      ['TemplateLiteral', 'RegExpLiteral', 'BigIntLiteral'].includes(type)) {
    return 'literal';
  }
  
  // Keywords / special
  if (['ThisExpression', 'Super', 'MetaProperty', 'NewTarget'].includes(type)) {
    return 'keyword';
  }
  
  // Patterns
  if (type.endsWith('Pattern') || 
      ['AssignmentPattern', 'RestElement', 'SpreadElement'].includes(type)) {
    return 'pattern';
  }
  
  // Module
  if (['ImportDeclaration', 'ExportDeclaration', 'ImportSpecifier', 'ExportSpecifier',
       'ImportDefaultSpecifier', 'ExportDefaultDeclaration', 'ExportNamedDeclaration',
       'ExportAllDeclaration'].includes(type)) {
    return 'module';
  }
  
  // TypeScript types
  if (type.includes('TypeAnnotation') || type.includes('Type') || 
      ['TSTypeReference', 'TSInterfaceDeclaration', 'TSTypeAliasDeclaration',
       'TSEnumDeclaration', 'TSModuleDeclaration'].includes(type)) {
    return 'type';
  }
  
  // JSX
  if (type.startsWith('JSX') || type === 'JSXElement' || type === 'JSXFragment') {
    return 'jsx';
  }
  
  // Comments
  if (type === 'Comment' || type === 'CommentBlock' || type === 'CommentLine') {
    return 'comment';
  }
  
  return 'other';
}

/**
 * Create a human-readable label for a node
 */
function createLabel(node: ASTNode): string {
  switch (node.type) {
    case 'Identifier':
      return node.name || 'Identifier';
    case 'Literal':
      return String(node.value ?? node.raw ?? 'Literal');
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
      return `${node.type}${node.id ? ` ${node.id.name}` : ''}()`;
    case 'ClassDeclaration':
    case 'ClassExpression':
      return `${node.type}${node.id ? ` ${node.id.name}` : ''}`;
    case 'VariableDeclarator':
      return `const ${node.id?.name || '?'} = ...`;
    case 'CallExpression':
      return `call(${node.callee?.type || '?'})`;
    case 'MemberExpression':
      return `${node.object?.type || '?'}.${node.property?.name || node.property?.type || '?'}`;
    case 'BinaryExpression':
      return `${node.left?.type || '?'} ${node.operator} ${node.right?.type || '?'}`;
    case 'IfStatement':
      return `if (${node.test?.type || '?'}) {...}`;
    case 'ForStatement':
    case 'ForInStatement':
    case 'ForOfStatement':
      return `${node.type} (...)`;
    case 'ReturnStatement':
      return `return ${node.argument?.type || ''}`;
    case 'ImportDeclaration':
      return `import ... from '${node.source?.value}'`;
    case 'ExportNamedDeclaration':
    case 'ExportDefaultDeclaration':
      return `export ${node.type.replace('Declaration', '').toLowerCase()}`;
    case 'BlockStatement':
      return `{ ${node.body?.length || 0} statements }`;
    case 'Program':
      return `Program (${node.body?.length || 0} statements)`;
    default:
      // Try to get a meaningful name from common properties
      if (node.name) return `${node.type}: ${node.name}`;
      if (node.key && node.key.name) return `${node.type}: ${node.key.name}`;
      if (node.property && node.property.name) return `${node.type}.${node.property.name}`;
      return node.type;
  }
}

/**
 * Get the relationship between parent and child node
 */
function getRelationship(parent: ASTNode, property: string): EdgeRelationship {
  if (Array.isArray(parent[property])) {
    return 'array-element';
  }
  if (property === 'body' || property === 'consequent' || property === 'alternate' || 
      property === 'declarations' || property === 'params' || property === 'arguments' ||
      property === 'elements' || property === 'properties' || property === 'specifiers') {
    return 'child';
  }
  return 'property';
}

/**
 * Convert AST to visualization nodes and edges
 */
export function visualizeAST(ast: ASTNode, options: VisualizerOptions = {}): VisualizationData {
  const {
    includeSource = true,
    maxSourceLength = 100,
    filter,
    expandTypes = [],
    collapseTypes = [],
  } = options;

  nodeIdCounter = 0;
  const nodes = new Map<string, VisualizerNode>();
  const edges: VisualizerEdge[] = [];
  let maxDepth = 0;

  const sourceCode = (ast as any).sourceCode || '';

  function traverse(node: ASTNode, parentId: string | null = null, depth: number = 0, property: string = ''): string {
    const nodeId = generateNodeId();
    maxDepth = Math.max(maxDepth, depth);

    const category = categorizeNode(node.type);
    const label = createLabel(node);
    let source: string | undefined;
    
    if (includeSource && sourceCode) {
      source = getNodeSource(sourceCode, node);
      if (source && source.length > maxSourceLength) {
        source = source.slice(0, maxSourceLength) + '...';
      }
    }

    const shouldExpand = expandTypes.includes(node.type) || 
                        (expandTypes.length === 0 && !collapseTypes.includes(node.type) && depth < 3);
    
    const visualizerNode: VisualizerNode = {
      id: nodeId,
      type: node.type,
      label,
      source,
      start: node.loc?.start ? { 
        line: node.loc.start.line, 
        column: node.loc.start.column 
      } : undefined,
      end: node.loc?.end ? { 
        line: node.loc.end.line, 
        column: node.loc.end.column 
      } : undefined,
      children: [],
      parent: parentId,
      depth,
      expanded: shouldExpand,
      selected: false,
      matchesFilter: !filter || filter({ 
        id: '', type: node.type, label, children: [], parent: '', depth, expanded: false, 
        selected: false, matchesFilter: true, category 
      }),
      category,
    };

    nodes.set(nodeId, visualizerNode);

    // Add edge from parent
    if (parentId) {
      const relationship = getRelationship(
        nodes.get(parentId)! as any, 
        property
      );
      edges.push({
        id: `edge_${parentId}_${nodeId}`,
        source: parentId,
        target: nodeId,
        relationship,
        property,
      });
    }

    // Traverse children
    const childProperties = Object.keys(node).filter(key => 
      key !== 'type' && key !== 'loc' && key !== 'range' && key !== 'sourceCode'
    );

    for (const prop of childProperties) {
      const value = (node as any)[prop];
      if (!value) continue;

      if (Array.isArray(value)) {
        value.forEach((child: any) => {
          if (child && typeof child === 'object' && child.type) {
            const childId = traverse(child, nodeId, depth + 1, prop);
            visualizerNode.children.push(childId);
          }
        });
      } else if (typeof value === 'object' && value.type) {
        const childId = traverse(value, nodeId, depth + 1, prop);
        visualizerNode.children.push(childId);
      }
    }

    return nodeId;
  }

  const rootId = traverse(ast);

  return {
    nodes,
    edges,
    rootId,
    nodeCount: nodes.size,
    maxDepth,
    sourceCode,
    language: (ast as any).language || 'javascript',
  };
}

/**
 * Apply filter to visualization data
 */
export function applyFilter(data: VisualizationData, filterFn: (node: VisualizerNode) => boolean): VisualizationData {
  const newNodes = new Map<string, VisualizerNode>();
  
  // First pass: determine which nodes match
  for (const [id, node] of data.nodes) {
    const matches = filterFn(node);
    newNodes.set(id, { ...node, matchesFilter: matches });
  }

  // Second pass: if parent doesn't match but child does, parent should be visible
  for (const [id, node] of newNodes) {
    if (!node.matchesFilter && node.children.length > 0) {
      const hasMatchingChild = node.children.some(childId => 
        newNodes.get(childId)?.matchesFilter
      );
      if (hasMatchingChild) {
        const updated = newNodes.get(id)!;
        updated.matchesFilter = true;
        newNodes.set(id, updated);
      }
    }
  }

  return {
    ...data,
    nodes: newNodes,
  };
}

/**
 * Find node by ID
 */
export function findNodeById(data: VisualizationData, id: string): VisualizerNode | undefined {
  return data.nodes.get(id);
}

/**
 * Get path from root to node
 */
export function getPathToNode(data: VisualizationData, nodeId: string): VisualizerNode[] {
  const path: VisualizerNode[] = [];
  let current: VisualizerNode | undefined = data.nodes.get(nodeId);
  
  while (current) {
    path.unshift(current);
    current = current.parent ? data.nodes.get(current.parent) : undefined;
  }
  
  return path;
}

/**
 * Get all nodes at a specific depth
 */
export function getNodesAtDepth(data: VisualizationData, depth: number): VisualizerNode[] {
  const result: VisualizerNode[] = [];
  for (const node of data.nodes.values()) {
    if (node.depth === depth) {
      result.push(node);
    }
  }
  return result;
}

/**
 * Get subtree rooted at node
 */
export function getSubtree(data: VisualizationData, nodeId: string): VisualizationData {
  const subtreeNodes = new Map<string, VisualizerNode>();
  const subtreeEdges: VisualizerEdge[] = [];
  
  function collect(nodeId: string) {
    const node = data.nodes.get(nodeId);
    if (!node || subtreeNodes.has(nodeId)) return;
    
    subtreeNodes.set(nodeId, { ...node });
    
    for (const childId of node.children) {
      collect(childId);
      const edge = data.edges.find(e => e.source === nodeId && e.target === childId);
      if (edge) subtreeEdges.push(edge);
    }
  }
  
  collect(nodeId);
  
  return {
    nodes: subtreeNodes,
    edges: subtreeEdges,
    rootId: nodeId,
    nodeCount: subtreeNodes.size,
    maxDepth: Math.max(...Array.from(subtreeNodes.values()).map(n => n.depth)),
    sourceCode: data.sourceCode,
    language: data.language,
  };
}

/**
 * Export visualization to DOT format (Graphviz)
 */
export function exportToDOT(data: VisualizationData): string {
  let dot = 'digraph AST {\n';
  dot += '  rankdir=TB;\n';
  dot += '  node [shape=box, style=filled, fillcolor=lightgray];\n';
  dot += '  edge [arrowhead=normal];\n\n';

  for (const node of data.nodes.values()) {
    if (!node.matchesFilter) continue;
    const label = node.label.replace(/"/g, '\\"');
    dot += `  "${node.id}" [label="${label}\\n(${node.type})"];\n`;
  }

  for (const edge of data.edges) {
    const source = data.nodes.get(edge.source);
    const target = data.nodes.get(edge.target);
    if (source?.matchesFilter && target?.matchesFilter) {
      dot += `  "${edge.source}" -> "${edge.target}";\n`;
    }
  }

  dot += '}\n';
  return dot;
}

/**
 * Export visualization to Mermaid format
 */
export function exportToMermaid(data: VisualizationData): string {
  let mermaid = 'graph TD\n';

  for (const node of data.nodes.values()) {
    if (!node.matchesFilter) continue;
    const label = node.label.replace(/"/g, "'");
    mermaid += `  ${node.id}["${label}\\n<small>${node.type}</small>"]\n`;
  }

  for (const edge of data.edges) {
    const source = data.nodes.get(edge.source);
    const target = data.nodes.get(edge.target);
    if (source?.matchesFilter && target?.matchesFilter) {
      mermaid += `  ${edge.source} --> ${edge.target}\n`;
    }
  }

  return mermaid;
}

/**
 * Export visualization to JSON
 */
export function exportToJSON(data: VisualizationData): string {
  const serializable = {
    nodes: Array.from(data.nodes.entries()).map(([id, node]) => [id, node]),
    edges: data.edges,
    rootId: data.rootId,
    nodeCount: data.nodeCount,
    maxDepth: data.maxDepth,
    sourceCode: data.sourceCode,
    language: data.language,
  };
  return JSON.stringify(serializable, null, 2);
}

// Re-export types
export type { VisualizerNode, VisualizerEdge, VisualizationData, VisualizerOptions, NodeCategory, EdgeRelationship } from './types';