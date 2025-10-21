/**
 * Shared Dagre Layout Engine
 * Core layout logic used by both WebWorker and synchronous fallback
 */

import type * as dagre from '@dagrejs/dagre';
import type { Edge } from '@vue-flow/core';

import type { DependencyNode } from '../components/DependencyGraph/types';
import type { GraphTheme } from '../theme/graphTheme';

export interface DagreLayoutConfig {
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  nodesep: number;
  edgesep: number;
  ranksep: number;
  theme: GraphTheme;
  animationDuration?: number;
}

export interface LayoutResult {
  nodes: DependencyNode[];
  edges: Edge[];
}

const PARENT_PADDING = 40;

/**
 * Apply dagre layout algorithm to graph nodes and edges with hierarchical awareness
 * @param nodes - The nodes to layout
 * @param edges - The edges connecting nodes
 * @param config - Layout configuration
 * @param dagreLib - The dagre library instance
 * @returns Layout result with positioned nodes
 */
export function applyDagreLayout(
  nodes: DependencyNode[],
  edges: Edge[],
  config: DagreLayoutConfig,
  dagreLib: typeof dagre
): LayoutResult {
  // Separate nodes by hierarchy level
  const packages = nodes.filter((n) => n.type === 'package');
  const modules = nodes.filter((n) => n.type === 'module');
  const groups = nodes.filter((n) => n.type === 'group');
  const leafNodes = nodes.filter((n) => n.type !== 'package' && n.type !== 'module' && n.type !== 'group');

  // Filter edges to exclude containment edges
  const validEdges = edges.filter((edge) => {
    const edgeType = (edge.data as { type?: string } | undefined)?.type;
    return edgeType !== 'contains';
  });

  // Strategy: Layout modules first, then position leaf nodes within each module
  const nodeMap = new Map<string, DependencyNode>();

  // Step 1: Layout modules as primary layout units
  if (modules.length > 0) {
    layoutModules(modules, validEdges, config, dagreLib, nodeMap);
  }

  // Step 2: Layout leaf nodes within their parent modules
  if (leafNodes.length > 0) {
    layoutLeafNodesWithinParents(leafNodes, modules, groups, validEdges, config, dagreLib, nodeMap);
  }

  // Step 4: Position and size group containers based on their children
  // Groups can contain modules (from folder clustering) or leaf nodes
  if (groups.length > 0) {
    const groupsWithModuleChildren = groups.filter((g) => modules.some((m) => m.parentNode === g.id));

    // Groups containing modules need both position and size calculated
    if (groupsWithModuleChildren.length > 0) {
      positionContainers(groupsWithModuleChildren, nodeMap);
    }
  }

  // Step 5: Position package containers based on their module children
  if (packages.length > 0) {
    positionContainers(packages, nodeMap);
  }

  // Convert map back to array, ensuring all nodes are included
  nodes.forEach((node) => {
    if (!nodeMap.has(node.id)) {
      nodeMap.set(node.id, node);
    }
  });

  const newNodes = Array.from(nodeMap.values());
  return { nodes: newNodes, edges };
}

/**
 * Layout modules as the primary layout units
 */
function layoutModules(
  modules: DependencyNode[],
  edges: Edge[],
  config: DagreLayoutConfig,
  dagreLib: typeof dagre,
  nodeMap: Map<string, DependencyNode>
): void {
  const g = new dagreLib.graphlib.Graph({ directed: true });

  g.setGraph({
    rankdir: config.direction,
    nodesep: config.nodesep,
    edgesep: config.edgesep,
    ranksep: config.ranksep,
    marginx: 50,
    marginy: 50,
  });
  g.setDefaultNodeLabel(() => ({}));
  g.setDefaultEdgeLabel(() => ({}));

  const moduleIds = new Set(modules.map((m) => m.id));
  // Add edges between modules
  edges
    .filter((e) => moduleIds.has(e.source) && moduleIds.has(e.target))
    .forEach((edge) => {
      const edgeType = (edge.data as { type?: string } | undefined)?.type;
      const minlen = edgeType === 'inheritance' ? 2 : 1;
      g.setEdge(edge.source, edge.target, { minlen });
    });

  // Run layout
  dagreLib.layout(g);

  // Position modules
  modules.forEach((module) => {
    const dagreNode = g.node(module.id) as { x: number; y: number } | undefined;
    if (dagreNode) {
      nodeMap.set(module.id, {
        ...module,
        position: {
          x: dagreNode.x,
          y: dagreNode.y,
        },
      });
    }
  });
}

/**
 * Layout leaf nodes within their parent modules using hierarchical grouping
 */
function layoutLeafNodesWithinParents(
  leafNodes: DependencyNode[],
  _modules: DependencyNode[],
  _groups: DependencyNode[],
  edges: Edge[],
  config: DagreLayoutConfig,
  dagreLib: typeof dagre,
  nodeMap: Map<string, DependencyNode>
): void {
  // Group leaf nodes by their parent (module or group)
  const nodesByParent = new Map<string, DependencyNode[]>();
  const orphanNodes: DependencyNode[] = [];

  leafNodes.forEach((node) => {
    const parentId = node.parentNode;
    if (parentId) {
      if (!nodesByParent.has(parentId)) {
        nodesByParent.set(parentId, []);
      }
      const parentChildren = nodesByParent.get(parentId);
      if (parentChildren) {
        parentChildren.push(node);
      }
    } else {
      orphanNodes.push(node);
    }
  });

  // Layout nodes within each parent separately
  nodesByParent.forEach((children, parentId) => {
    layoutNodesWithinContainer(children, parentId, edges, config, dagreLib, nodeMap);
  });

  // Layout orphan nodes (nodes without parents) at the top level
  if (orphanNodes.length > 0) {
    layoutOrphanNodes(orphanNodes, edges, config, dagreLib, nodeMap);
  }
}

/**
 * Layout nodes within a specific container (module or group)
 */
function layoutNodesWithinContainer(
  children: DependencyNode[],
  _parentId: string,
  edges: Edge[],
  config: DagreLayoutConfig,
  dagreLib: typeof dagre,
  nodeMap: Map<string, DependencyNode>
): void {
  const g = new dagreLib.graphlib.Graph({ directed: true });

  g.setGraph({
    rankdir: config.direction,
    nodesep: config.nodesep * 0.5, // Tighter spacing within containers
    edgesep: config.edgesep * 0.5,
    ranksep: config.ranksep * 0.5,
    marginx: PARENT_PADDING,
    marginy: PARENT_PADDING,
  });
  g.setDefaultNodeLabel(() => ({}));
  g.setDefaultEdgeLabel(() => ({}));

  // Add children to graph
  const childIds = new Set(children.map((c) => c.id));
  children.forEach((child) => {
    g.setNode(child.id, {});
  });

  // Add edges between children
  edges
    .filter((e) => childIds.has(e.source) && childIds.has(e.target))
    .forEach((edge) => {
      const edgeType = (edge.data as { type?: string } | undefined)?.type;
      const minlen = edgeType === 'inheritance' ? 2 : 1;
      g.setEdge(edge.source, edge.target, { minlen });
    });

  // Run layout
  dagreLib.layout(g);

  // Position children relative to parent (VueFlow handles the parent offset automatically)
  children.forEach((child) => {
    const dagreNode = g.node(child.id) as { x: number; y: number } | undefined;
    if (dagreNode) {
      nodeMap.set(child.id, {
        ...child,
        position: {
          x: dagreNode.x,
          y: dagreNode.y,
        },
      });
    }
  });
}

/**
 * Layout orphan nodes (nodes without parents) at the top level
 */
function layoutOrphanNodes(
  orphanNodes: DependencyNode[],
  edges: Edge[],
  config: DagreLayoutConfig,
  dagreLib: typeof dagre,
  nodeMap: Map<string, DependencyNode>
): void {
  const g = new dagreLib.graphlib.Graph({ directed: true });

  g.setGraph({
    rankdir: config.direction,
    nodesep: config.nodesep,
    edgesep: config.edgesep,
    ranksep: config.ranksep,
    marginx: 50,
    marginy: 50,
  });
  g.setDefaultNodeLabel(() => ({}));
  g.setDefaultEdgeLabel(() => ({}));

  const orphanIds = new Set(orphanNodes.map((n) => n.id));
  orphanNodes.forEach((node) => {
    g.setNode(node.id, {});
  });

  edges
    .filter((e) => orphanIds.has(e.source) && orphanIds.has(e.target))
    .forEach((edge) => {
      const edgeType = (edge.data as { type?: string } | undefined)?.type;
      const minlen = edgeType === 'inheritance' ? 2 : 1;
      g.setEdge(edge.source, edge.target, { minlen });
    });

  dagreLib.layout(g);

  orphanNodes.forEach((node) => {
    const dagreNode = g.node(node.id) as { x: number; y: number } | undefined;
    if (dagreNode) {
      nodeMap.set(node.id, {
        ...node,
        position: {
          x: dagreNode.x,
          y: dagreNode.y,
        },
      });
    }
  });
}

/**
 * Position containers (packages, groups) based on their children's bounds
 * This sets both position AND size based on children
 */
function positionContainers(containers: DependencyNode[], nodeMap: Map<string, DependencyNode>): void {
  containers.forEach((container) => {
    const bounds = calculateContainerBounds(container.id, nodeMap);
    if (bounds) {
      // Set BOTH top-level width/height AND style.width/height for VueFlow
      nodeMap.set(container.id, {
        ...container,
        position: { x: bounds.x, y: bounds.y },
      });
    } else {
      // No children found, use default positioning
      nodeMap.set(container.id, container);
    }
  });
}

/**
 * Calculate the bounding box for a container based on its children's ABSOLUTE positions
 * Note: Children with extent='parent' have positions relative to their parent, so we convert them
 */
function calculateContainerBounds(
  containerId: string,
  nodeMap: Map<string, DependencyNode>
): { x: number; y: number } | null {
  // Find all children of this container
  const children = Array.from(nodeMap.values()).filter((n) => n.parentNode === containerId);

  if (children.length === 0) {
    return null;
  }

  const parent = nodeMap.get(containerId);
  // Parent position is required for relative child positioning
  // If parent doesn't exist yet, default to (0, 0)
  const parentX = parent ? parent.position.x : 0;
  const parentY = parent ? parent.position.y : 0;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  children.forEach((child) => {
    // If child has extent='parent', positions are relative to parent
    // Convert to absolute coordinates for bounds calculation
    const childAbsX = child.extent === 'parent' ? parentX + child.position.x : child.position.x;
    const childAbsY = child.extent === 'parent' ? parentY + child.position.y : child.position.y;

    minX = Math.min(minX, childAbsX);
    minY = Math.min(minY, childAbsY);
    maxX = Math.max(maxX, childAbsX);
    maxY = Math.max(maxY, childAbsY);
  });

  if (minX === Infinity) {
    return null;
  }

  return {
    x: minX - PARENT_PADDING,
    y: minY - PARENT_PADDING,
  };
}

/**
 * Simple grid layout fallback when dagre fails
 * @param nodes - The nodes to layout
 * @param edges - The edges connecting nodes
 * @returns Layout result with positioned nodes in a grid
 */
export function applyGridLayoutFallback(nodes: DependencyNode[], edges: Edge[]): LayoutResult {
  const packages = nodes.filter((n) => n.type === 'package');
  const modules = nodes.filter((n) => n.type === 'module');
  const others = nodes.filter((n) => n.type !== 'package' && n.type !== 'module');

  let currentY = 50;
  let currentX = 50;
  const horizontalSpacing = 250;
  const verticalSpacing = 200;
  const maxPerRow = 4;

  // Layout packages
  packages.forEach((node, index) => {
    if (index > 0 && index % maxPerRow === 0) {
      currentY += verticalSpacing;
      currentX = 50;
    }
    node.position = { x: currentX, y: currentY };
    currentX += horizontalSpacing;
  });

  // Layout modules
  if (modules.length > 0) {
    currentY += verticalSpacing;
    currentX = 50;
    modules.forEach((node, index) => {
      if (index > 0 && index % maxPerRow === 0) {
        currentY += verticalSpacing;
        currentX = 50;
      }
      node.position = { x: currentX, y: currentY };
      currentX += horizontalSpacing;
    });
  }

  // Layout other nodes
  if (others.length > 0) {
    currentY += verticalSpacing;
    currentX = 50;
    others.forEach((node, index) => {
      if (index > 0 && index % maxPerRow === 0) {
        currentY += verticalSpacing;
        currentX = 50;
      }
      node.position = { x: currentX, y: currentY };
      currentX += horizontalSpacing;
    });
  }

  return { nodes, edges };
}
