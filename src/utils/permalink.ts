/**
 * Permalink Utilities
 * 
 * Generates and parses shareable permalinks for AST visualizations.
 * Uses base64url encoding for URL-safe sharing.
 */

import { ASTNode } from '../parser/parser';
import { VisualizerOptions, PermalinkData, VisualizationData, VisualizerNode } from '../visualizer/types';
import { visualizeAST } from '../visualizer/visualizer';

const PERMALINK_VERSION = '1.0';

/**
 * Encode data to base64url (URL-safe base64)
 */
function base64urlEncode(data: string): string {
  return btoa(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decode base64url data
 */
function base64urlDecode(data: string): string {
  // Add padding if needed
  let padded = data.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4) {
    padded += '=';
  }
  return atob(padded);
}

/**
 * Compress data using simple LZW-like approach for smaller URLs
 * For production, consider using a proper compression library
 */
function compress(data: string): string {
  // Simple approach: just use base64url for now
  // Could be enhanced with LZ-string or similar
  return base64urlEncode(data);
}

/**
 * Decompress data
 */
function decompress(data: string): string {
  return base64urlDecode(data);
}

/**
 * Generate a shareable permalink for an AST
 * 
 * @param ast - The AST to encode
 * @param options - Visualizer options
 * @param viewport - Optional viewport state
 * @returns URL-safe permalink string
 */
export function generatePermalink(
  ast: ASTNode, 
  options: VisualizerOptions = {},
  viewport?: PermalinkData['viewport']
): string {
  // First visualize the AST to get the data
  const visData = visualizeAST(ast, options);
  
  // Create permalink data
  const permalinkData: PermalinkData = {
    ast: JSON.stringify({
      nodes: Array.from(visData.nodes.entries()).map(([id, node]) => [id, node]),
      edges: visData.edges,
      rootId: visData.rootId,
      nodeCount: visData.nodeCount,
      maxDepth: visData.maxDepth,
      sourceCode: visData.sourceCode,
      language: visData.language,
    }),
    options,
    viewport,
    timestamp: Date.now(),
    version: PERMALINK_VERSION,
  };

  // Compress and encode
  const json = JSON.stringify(permalinkData);
  const compressed = compress(json);
  
  // Return as URL fragment (after #)
  return `#${compressed}`;
}

/**
 * Parse a permalink and extract the visualization data
 * 
 * @param permalink - The permalink string (with or without # prefix)
 * @returns Parsed visualization data and options, or null if invalid
 */
export function parsePermalink(permalink: string): {
  data: VisualizationData;
  options: VisualizerOptions;
  viewport?: PermalinkData['viewport'];
} | null {
  try {
    // Remove # prefix if present
    const encoded = permalink.startsWith('#') ? permalink.slice(1) : permalink;
    
    // Decompress and parse
    const json = decompress(encoded);
    const permalinkData: PermalinkData = JSON.parse(json);
    
    // Check version compatibility
    if (permalinkData.version !== PERMALINK_VERSION) {
      console.warn(`Permalink version mismatch: expected ${PERMALINK_VERSION}, got ${permalinkData.version}`);
    }
    
    // Reconstruct visualization data
    const parsed = JSON.parse(permalinkData.ast);
    const nodes = new Map<string, VisualizerNode>(parsed.nodes);
    const visData: VisualizationData = {
      nodes,
      edges: parsed.edges,
      rootId: parsed.rootId,
      nodeCount: parsed.nodeCount,
      maxDepth: parsed.maxDepth,
      sourceCode: parsed.sourceCode,
      language: parsed.language,
    };
    
    return {
      data: visData,
      options: permalinkData.options,
      viewport: permalinkData.viewport,
    };
  } catch (error) {
    console.error('Failed to parse permalink:', error);
    return null;
  }
}

/**
 * Generate a short ID for sharing (alternative to full permalink)
 * Could be used with a backend service to store full data
 */
export function generateShortId(ast: ASTNode, options: VisualizerOptions = {}): string {
  // Create a hash of the AST structure for deduplication
  const visData = visualizeAST(ast, options);
  const hashInput = `${visData.rootId}-${visData.nodeCount}-${visData.maxDepth}-${visData.sourceCode.length}`;
  
  // Simple hash function (for production, use crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to base36 for short ID
  return Math.abs(hash).toString(36);
}

/**
 * Validate a permalink without fully parsing
 */
export function isValidPermalink(permalink: string): boolean {
  try {
    const encoded = permalink.startsWith('#') ? permalink.slice(1) : permalink;
    const json = decompress(encoded);
    const data = JSON.parse(json);
    return data.version === PERMALINK_VERSION && 
           data.ast && 
           data.options && 
           typeof data.timestamp === 'number';
  } catch {
    return false;
  }
}

/**
 * Get permalink metadata without full parsing
 */
export function getPermalinkMetadata(permalink: string): {
  version: string;
  timestamp: number;
  nodeCount: number;
  language: string;
} | null {
  try {
    const encoded = permalink.startsWith('#') ? permalink.slice(1) : permalink;
    const json = decompress(encoded);
    const data = JSON.parse(json);
    const ast = JSON.parse(data.ast);
    return {
      version: data.version,
      timestamp: data.timestamp,
      nodeCount: ast.nodeCount,
      language: ast.language,
    };
  } catch {
    return null;
  }
}