/**
 * AI Prompt Generator
 * 
 * Converts AST nodes into structured prompts optimized for LLM consumption.
 * Helps developers communicate code structure to AI assistants effectively.
 */

import { ASTNode, findNodes, getNodeSource } from '../parser/parser';

/**
 * Generate an AI-optimized prompt from an AST
 * 
 * @param ast - Root AST node
 * @param sourceCode - Original source code
 * @param focusNodeId - Optional specific node to focus on
 * @returns Structured prompt string for AI consumption
 */
export function copyAsAIPrompt(
  ast: ASTNode, 
  sourceCode: string = '',
  _focusNodeId?: string
): string {
  const sections: string[] = [];
  
  // Header
  sections.push('# Code Structure for AI Analysis');
  sections.push('');
  sections.push('## Overview');
  sections.push(`- **Language**: ${(ast as any).language || 'JavaScript/TypeScript'}`);
  sections.push(`- **Total Nodes**: ${countNodes(ast)}`);
  sections.push(`- **Max Depth**: ${getMaxDepth(ast)}`);
  sections.push('');
  
  // Key structures
  sections.push('## Key Structures');
  
  // Functions
  const functions = findNodes(ast, n => 
    ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(n.type)
  );
  if (functions.length > 0) {
    sections.push('### Functions');
    for (const fn of functions.slice(0, 20)) {
      sections.push(formatFunctionForAI(fn, sourceCode));
    }
    sections.push('');
  }
  
  // Classes
  const classes = findNodes(ast, n => 
    ['ClassDeclaration', 'ClassExpression'].includes(n.type)
  );
  if (classes.length > 0) {
    sections.push('### Classes');
    for (const cls of classes.slice(0, 10)) {
      sections.push(formatClassForAI(cls, sourceCode));
    }
    sections.push('');
  }
  
  // Imports/Exports
  const imports = findNodes(ast, n => n.type === 'ImportDeclaration');
  if (imports.length > 0) {
    sections.push('### Imports');
    for (const imp of imports.slice(0, 20)) {
      sections.push(formatImportForAI(imp, sourceCode));
    }
    sections.push('');
  }
  
  const exports = findNodes(ast, n => n.type.startsWith('Export'));
  if (exports.length > 0) {
    sections.push('### Exports');
    for (const exp of exports.slice(0, 20)) {
      sections.push(formatExportForAI(exp, sourceCode));
    }
    sections.push('');
  }
  
  // Type definitions (TypeScript)
  const types = findNodes(ast, n => 
    n.type.includes('Type') || n.type.includes('Interface') || n.type.includes('Enum')
  );
  if (types.length > 0) {
    sections.push('### Type Definitions');
    for (const type of types.slice(0, 15)) {
      sections.push(formatTypeForAI(type, sourceCode));
    }
    sections.push('');
  }
  
  // Control flow
  const controlFlow = findNodes(ast, n => 
    ['IfStatement', 'ForStatement', 'WhileStatement', 'ForInStatement', 'ForOfStatement',
     'SwitchStatement', 'TryStatement', 'CatchClause'].includes(n.type)
  );
  if (controlFlow.length > 0) {
    sections.push('### Control Flow');
    for (const cf of controlFlow.slice(0, 15)) {
      sections.push(formatControlFlowForAI(cf, sourceCode));
    }
    sections.push('');
  }
  
  // Full source (truncated for very long files)
  if (sourceCode) {
    sections.push('## Full Source Code');
    const maxLines = 200;
    const lines = sourceCode.split('\n');
    if (lines.length > maxLines) {
      sections.push('```typescript');
      sections.push(lines.slice(0, maxLines).join('\n'));
      sections.push(`... (${lines.length - maxLines} more lines)`);
      sections.push('```');
    } else {
      sections.push('```typescript');
      sections.push(sourceCode);
      sections.push('```');
    }
  }
  
  return sections.join('\n');
}

/**
 * Generate a minimal prompt for a specific node
 */
export function generateNodePrompt(node: ASTNode, sourceCode: string = ''): string {
  const parts = [
    `**Node Type**: ${node.type}`,
    `**Location**: ${node.loc ? `${node.loc.start.line}:${node.loc.start.column}-${node.loc.end.line}:${node.loc.end.column}` : 'unknown'}`,
  ];
  
  if (sourceCode && node.range) {
    const source = getNodeSource(sourceCode, node);
    parts.push(`**Source**:\n\`\`\`typescript\n${source}\n\`\`\``);
  }
  
  // Add relevant properties
  const relevantProps = getRelevantProperties(node);
  if (relevantProps.length > 0) {
    parts.push('**Properties**:');
    parts.push(...relevantProps.map(p => `- ${p.key}: ${p.value}`));
  }
  
  return parts.join('\n');
}

/**
 * Format a function node for AI prompt
 */
function formatFunctionForAI(node: ASTNode, sourceCode: string): string {
  const name = node.id?.name || (node.type === 'ArrowFunctionExpression' ? 'arrow function' : 'anonymous');
  const params = node.params?.map((p: any) => p.name || p.type).join(', ') || '';
  const returnType = node.returnType ? `: ${getNodeSource(sourceCode, node.returnType)}` : '';
  const async = node.async ? 'async ' : '';
  const generator = node.generator ? '*' : '';
  
  let result = `- **${async}${node.type}${generator} ${name}**(${params})${returnType}`;
  
  if (sourceCode && node.body) {
    const bodySource = getNodeSource(sourceCode, node.body);
    if (bodySource.length < 200) {
      result += `\n  \`\`\`typescript\n  ${bodySource}\n  \`\`\``;
    } else {
      result += ` // ${node.body.body?.length || 0} statements`;
    }
  }
  
  return result;
}

/**
 * Format a class node for AI prompt
 */
function formatClassForAI(node: ASTNode, sourceCode: string): string {
  const name = node.id?.name || 'anonymous';
  const extendsClause = node.superClass ? ` extends ${getNodeSource(sourceCode, node.superClass)}` : '';
  const implementsClause = node.implements?.length ? ` implements ${node.implements.map((i: any) => getNodeSource(sourceCode, i)).join(', ')}` : '';
  
  let result = `- **class ${name}${extendsClause}${implementsClause}**`;
  
  if (node.body && node.body.body) {
    const members = node.body.body
      .filter((m: any) => m.type === 'MethodDefinition' || m.type === 'PropertyDefinition')
      .slice(0, 10)
      .map((m: any) => {
        const key = m.key?.name || m.key?.type || '?';
        const kind = m.kind || (m.type === 'MethodDefinition' ? 'method' : 'property');
        const static_ = m.static ? 'static ' : '';
        return `  - ${static_}${kind} ${key}`;
      });
    
    if (members.length > 0) {
      result += '\n' + members.join('\n');
    }
    if (node.body.body.length > 10) {
      result += `\n  ... and ${node.body.body.length - 10} more members`;
    }
  }
  
  return result;
}

/**
 * Format an import for AI prompt
 */
function formatImportForAI(node: ASTNode, _sourceCode: string): string {
  const source = node.source?.value || 'unknown';
  const specifiers = node.specifiers?.map((s: any) => {
    if (s.type === 'ImportDefaultSpecifier') return s.local.name;
    if (s.type === 'ImportNamespaceSpecifier') return `* as ${s.local.name}`;
    if (s.type === 'ImportSpecifier') return `${s.imported?.name || s.imported?.value} as ${s.local.name}`;
    return s.local?.name || '?';
  }).join(', ') || '';
  
  return `- import { ${specifiers} } from '${source}'`;
}

/**
 * Format an export for AI prompt
 */
function formatExportForAI(node: ASTNode, _sourceCode: string): string {
  if (node.type === 'ExportDefaultDeclaration') {
    return `- export default ${node.declaration?.type || node.declaration?.name || 'anonymous'}`;
  }
  if (node.type === 'ExportNamedDeclaration') {
    if (node.declaration) {
      return `- export ${node.declaration.type} ${node.declaration.id?.name || ''}`;
    }
    const specifiers = node.specifiers?.map((s: any) => 
      `${s.local?.name || '?'} as ${s.exported?.name || s.local?.name || '?'}`
    ).join(', ') || '';
    return `- export { ${specifiers} }${node.source ? ` from '${node.source.value}'` : ''}`;
  }
  if (node.type === 'ExportAllDeclaration') {
    return `- export * from '${node.source?.value}'`;
  }
  return `- export ${node.type}`;
}

/**
 * Format a type for AI prompt
 */
function formatTypeForAI(node: ASTNode, _sourceCode: string): string {
  const name = node.id?.name || node.typeName?.name || 'anonymous';
  return `- ${node.type}: ${name}`;
}

/**
 * Format control flow for AI prompt
 */
function formatControlFlowForAI(node: ASTNode, sourceCode: string): string {
  switch (node.type) {
    case 'IfStatement':
      return `- if (${getNodeSource(sourceCode, node.test)}) { ... }${node.alternate ? ' else { ... }' : ''}`;
    case 'ForStatement':
      return `- for (${getNodeSource(sourceCode, node.init)}; ${getNodeSource(sourceCode, node.test)}; ${getNodeSource(sourceCode, node.update)}) { ... }`;
    case 'ForInStatement':
    case 'ForOfStatement':
      return `- ${node.type.replace('Statement', '').toLowerCase()} (${getNodeSource(sourceCode, node.left)} of ${getNodeSource(sourceCode, node.right)}) { ... }`;
    case 'WhileStatement':
      return `- while (${getNodeSource(sourceCode, node.test)}) { ... }`;
    case 'SwitchStatement':
      return `- switch (${getNodeSource(sourceCode, node.discriminant)}) { ${node.cases?.length || 0} cases }`;
    case 'TryStatement':
      return `- try { ... }${node.handler ? ' catch { ... }' : ''}${node.finalizer ? ' finally { ... }' : ''}`;
    default:
      return `- ${node.type}`;
  }
}

/**
 * Get relevant properties for a node (excluding loc, range, etc.)
 */
function getRelevantProperties(node: ASTNode): Array<{ key: string; value: string }> {
  const skipKeys = ['type', 'loc', 'range', 'start', 'end', 'sourceCode', 'body', 'params', 'declaration'];
  const result: Array<{ key: string; value: string }> = [];
  
  for (const [key, value] of Object.entries(node)) {
    if (skipKeys.includes(key)) continue;
    if (value === null || value === undefined) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    
    let displayValue: string;
    if (typeof value === 'object') {
      if (value.type) {
        displayValue = `${value.type}${value.name ? ` ${value.name}` : ''}`;
      } else if (Array.isArray(value)) {
        displayValue = `[${value.length} items]`;
      } else {
        displayValue = JSON.stringify(value).slice(0, 100);
      }
    } else {
      displayValue = String(value);
    }
    
    result.push({ key, value: displayValue });
  }
  
  return result.slice(0, 10);
}

/**
 * Format a node for AI (general purpose)
 */
export function formatNodeForAI(node: ASTNode, sourceCode: string, depth: number = 0): string {
  const indent = '  '.repeat(depth);
  const label = getNodeLabel(node);
  let result = `${indent}- **${node.type}**: ${label}`;
  
  if (sourceCode && node.range) {
    const source = getNodeSource(sourceCode, node);
    if (source.length < 100) {
      result += `\n${indent}  \`\`\`typescript\n${indent}  ${source}\n${indent}  \`\`\``;
    }
  }
  
  return result;
}

/**
 * Get a short label for a node
 */
function getNodeLabel(node: ASTNode): string {
  if (node.name) return node.name;
  if (node.key?.name) return node.key.name;
  if (node.property?.name) return node.property.name;
  if (node.value !== undefined) return String(node.value);
  if (node.raw) return node.raw;
  return '';
}

/**
 * Count total nodes in AST
 */
function countNodes(node: ASTNode): number {
  let count = 1;
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'loc' || key === 'range') continue;
    const value = (node as any)[key];
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === 'object' && item.type) {
            count += countNodes(item);
          }
        }
      } else if (value.type) {
        count += countNodes(value);
      }
    }
  }
  return count;
}

/**
 * Get max depth of AST
 */
function getMaxDepth(node: ASTNode, currentDepth = 0): number {
  let max = currentDepth;
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'loc' || key === 'range') continue;
    const value = (node as any)[key];
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === 'object' && item.type) {
            max = Math.max(max, getMaxDepth(item, currentDepth + 1));
          }
        }
      } else if (value.type) {
        max = Math.max(max, getMaxDepth(value, currentDepth + 1));
      }
    }
  }
  return max;
}

/**
 * Generate a summary prompt for quick AI context
 */
export function generateSummaryPrompt(ast: ASTNode, sourceCode: string): string {
  const funcCount = findNodes(ast, n => n.type.includes('Function')).length;
  const classCount = findNodes(ast, n => n.type.includes('Class')).length;
  const importCount = findNodes(ast, n => n.type === 'ImportDeclaration').length;
  const exportCount = findNodes(ast, n => n.type.startsWith('Export')).length;
  const lines = sourceCode.split('\n').length;
  
  return [
    '## Quick Code Summary',
    `- **Lines**: ${lines}`,
    `- **Functions**: ${funcCount}`,
    `- **Classes**: ${classCount}`,
    `- **Imports**: ${importCount}`,
    `- **Exports**: ${exportCount}`,
    `- **Estimated Complexity**: ${estimateComplexity(ast)}`,
  ].join('\n');
}

/**
 * Estimate code complexity (simplified)
 */
function estimateComplexity(ast: ASTNode): 'low' | 'medium' | 'high' {
  const nodes = countNodes(ast);
  const depth = getMaxDepth(ast);
  const functions = findNodes(ast, n => n.type.includes('Function')).length;
  const controlFlow = findNodes(ast, n => 
    ['IfStatement', 'ForStatement', 'WhileStatement', 'SwitchStatement', 'TryStatement'].includes(n.type)
  ).length;
  
  const score = nodes * 0.1 + depth * 2 + functions * 3 + controlFlow * 2;
  
  if (score < 50) return 'low';
  if (score < 150) return 'medium';
  return 'high';
}