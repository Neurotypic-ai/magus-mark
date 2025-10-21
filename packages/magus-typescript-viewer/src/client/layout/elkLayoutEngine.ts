// Resolve asset URLs for UMD build and worker via Vite
import elkWorkerUrl from 'elkjs/lib/elk-worker.min.js?url';
import elkBundledUrl from 'elkjs/lib/elk.bundled.js?url';

import type { DependencyNode, GraphEdge } from '../components/DependencyGraph/types';
import type { GraphTheme } from '../theme/graphTheme';

// Local minimal ELK types to avoid runtime imports in ESM
type LayoutOptions = Record<string, string>;

interface ElkExtendedEdge {
  id: string;
  sources: string[];
  targets: string[];
}

interface ElkNode {
  id: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  layoutOptions?: LayoutOptions;
  children?: ElkNode[];
  edges?: ElkExtendedEdge[];
}

// Note: Types come from 'elkjs' type definitions imported below

/**
 * ELK Layout Engine
 * Core layout logic using Eclipse Layout Kernel for hierarchical graph layouts
 */

export interface ElkLayoutConfig {
  direction: 'DOWN' | 'RIGHT' | 'LEFT' | 'UP';
  nodeSpacing: number;
  layerSpacing: number;
  edgeSpacing: number;
  algorithm: 'layered' | 'force' | 'stress' | 'mrtree';
  theme: GraphTheme;
  animationDuration?: number;
}

export interface LayoutResult {
  nodes: DependencyNode[];
  edges: GraphEdge[];
}

const DEFAULT_WIDTH = 200;
const PARENT_PADDING = 40;

/**
 * Apply ELK layout algorithm to graph nodes and edges with hierarchical awareness
 * @param nodes - The nodes to layout
 * @param edges - The edges connecting nodes
 * @param config - Layout configuration
 * @returns Layout result with positioned nodes
 */
export async function applyElkLayout(
  nodes: DependencyNode[],
  edges: GraphEdge[],
  config: ElkLayoutConfig
): Promise<LayoutResult> {
  const elk = await createElkInstance();

  // Build ELK graph structure
  const elkGraph = buildElkGraph(nodes, edges, config);

  // Apply layout
  const laidOutGraph = await elk.layout(elkGraph);

  // Convert back to our node/edge format
  return convertElkLayout(laidOutGraph, nodes, edges);
}

async function createElkInstance(): Promise<{ layout: (graph: ElkNode) => Promise<ElkNode> }> {
  // If already loaded on window, use it
  const existing = (globalThis as unknown as { ELK?: new (options?: { workerUrl?: string }) => unknown }).ELK;
  if (typeof existing === 'function') {
    return new (existing as new (options: { workerUrl: string }) => { layout: (graph: ElkNode) => Promise<ElkNode> })({
      workerUrl: elkWorkerUrl,
    });
  }

  // Dynamically inject the UMD script so it defines window.ELK
  await loadScript(elkBundledUrl);
  const ctor = (globalThis as unknown as { ELK?: new (options?: { workerUrl?: string }) => unknown }).ELK;
  if (typeof ctor === 'function') {
    return new (ctor as new (options: { workerUrl: string }) => { layout: (graph: ElkNode) => Promise<ElkNode> })({
      workerUrl: elkWorkerUrl,
    });
  }
  throw new Error('Failed to initialize ELK: UMD build not available');
}

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      reject(new Error(`Failed to load script: ${url}`));
    };
    document.head.appendChild(script);
  });
}

/**
 * Build ELK graph structure from our nodes and edges
 */
function buildElkGraph(nodes: DependencyNode[], edges: GraphEdge[], config: ElkLayoutConfig): ElkNode {
  // Separate nodes by hierarchy
  const rootNodes = nodes.filter((n) => !n.data.parent);
  const childNodes = nodes.filter((n) => n.data.parent);

  // Build node lookup
  const nodeMap = new Map<string, DependencyNode>();
  nodes.forEach((n) => nodeMap.set(n.data.id, n));

  // Filter out containment edges
  const layoutEdges = edges.filter((e) => e.data.type !== 'contains');

  // Build ELK nodes recursively
  const elkNodes: ElkNode[] = rootNodes.map((node) => buildElkNode(node, childNodes, nodeMap, config));

  // Build ELK edges
  const elkEdges: ElkExtendedEdge[] = layoutEdges.map((edge) => ({
    id: edge.data.id,
    sources: [edge.data.source],
    targets: [edge.data.target],
  }));

  // Configure layout options
  const layoutOptions: LayoutOptions = {
    'elk.algorithm': config.algorithm,
    'elk.direction': config.direction,
    'elk.spacing.nodeNode': String(config.nodeSpacing),
    'elk.layered.spacing.nodeNodeBetweenLayers': String(config.layerSpacing),
    'elk.spacing.edgeEdge': String(config.edgeSpacing),
    'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    // Edge routing
    'elk.edgeRouting': 'ORTHOGONAL',
    'elk.layered.edgeRouting.orthogonalEdgeRouting': 'true',
    // Padding
    'elk.padding': `[top=${String(PARENT_PADDING)},left=${String(PARENT_PADDING)},bottom=${String(PARENT_PADDING)},right=${String(PARENT_PADDING)}]`,
  };

  return {
    id: 'root',
    layoutOptions,
    children: elkNodes,
    edges: elkEdges,
  };
}

/**
 * Recursively build an ELK node with its children
 */
function buildElkNode(
  node: DependencyNode,
  allChildNodes: DependencyNode[],
  nodeMap: Map<string, DependencyNode>,
  config: ElkLayoutConfig
): ElkNode {
  const children = allChildNodes.filter((child) => child.data.parent === node.data.id);

  // Determine node dimensions
  const width = getNodeWidth(node, config);
  const height = getNodeHeight(node, config);

  const elkNode: ElkNode = {
    id: node.data.id,
    width,
    height,
  };

  // If node has children, recursively build them
  if (children.length > 0) {
    elkNode.children = children.map((child) => buildElkNode(child, allChildNodes, nodeMap, config));
    // Parent nodes need special layout options
    elkNode.layoutOptions = {
      'elk.algorithm': config.algorithm,
      'elk.direction': config.direction,
      'elk.padding': `[top=${String(PARENT_PADDING)},left=${String(PARENT_PADDING)},bottom=${String(PARENT_PADDING)},right=${String(PARENT_PADDING)}]`,
    };
  }

  return elkNode;
}

/**
 * Convert laid out ELK graph back to our format
 */
function convertElkLayout(
  elkGraph: ElkNode,
  originalNodes: DependencyNode[],
  originalEdges: GraphEdge[]
): LayoutResult {
  const nodeMap = new Map<string, DependencyNode>();
  originalNodes.forEach((n) => nodeMap.set(n.data.id, n));

  const laidOutNodes: DependencyNode[] = [];

  // Recursively process nodes
  function processElkNode(elkNode: ElkNode, parentOffset = { x: 0, y: 0 }): void {
    const originalNode = nodeMap.get(elkNode.id);
    if (!originalNode) return;

    // Calculate absolute position (ELK gives positions relative to parent)
    const position = {
      x: (elkNode.x ?? 0) + parentOffset.x,
      y: (elkNode.y ?? 0) + parentOffset.y,
    };

    // Create updated node with position
    laidOutNodes.push({
      ...originalNode,
      position,
    });

    // Process children recursively
    if (elkNode.children) {
      const childOffset = {
        x: position.x,
        y: position.y,
      };
      elkNode.children.forEach((child) => {
        processElkNode(child, childOffset);
      });
    }
  }

  // Process all root nodes
  if (elkGraph.children) {
    elkGraph.children.forEach((child) => {
      processElkNode(child);
    });
  }

  // Edges remain unchanged (Cytoscape will handle rendering)
  return {
    nodes: laidOutNodes,
    edges: originalEdges,
  };
}

/**
 * Calculate node width based on type and content
 */
function getNodeWidth(node: DependencyNode, _config: ElkLayoutConfig): number {
  const type = node.data.type;

  switch (type) {
    case 'package':
      return 400;
    case 'module':
      return 300;
    case 'group':
      return 350;
    case 'class':
    case 'interface':
      return 250;
    default:
      return DEFAULT_WIDTH;
  }
}

/**
 * Calculate node height based on type and content
 */
function getNodeHeight(node: DependencyNode, _config: ElkLayoutConfig): number {
  const type = node.data.type;
  const baseHeight = type === 'class' || type === 'interface' ? 80 : 60;

  // Add height for methods and properties
  const methodCount = node.data.methods?.length ?? 0;
  const propertyCount = node.data.properties?.length ?? 0;

  return baseHeight + methodCount * 20 + propertyCount * 15;
}

/**
 * Synchronous version that returns a Promise for compatibility
 * ELK is async by nature, so this just wraps the async function
 */
export function applyElkLayoutSync(
  nodes: DependencyNode[],
  edges: GraphEdge[],
  config: ElkLayoutConfig
): Promise<LayoutResult> {
  return applyElkLayout(nodes, edges, config);
}
