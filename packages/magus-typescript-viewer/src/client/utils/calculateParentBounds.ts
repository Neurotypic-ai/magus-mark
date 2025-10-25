import { createLogger } from '../../shared/utils/logger';

import type { DependencyNode } from '../components/DependencyGraph/types';

const logger = createLogger('calculateParentBounds');

/**
 * Minimum dimensions for different parent node types
 */
const MIN_DIMENSIONS: Record<string, { width: number; height: number }> = {
  package: { width: 600, height: 400 },
  module: { width: 300, height: 200 },
  group: { width: 400, height: 300 },
};

/**
 * Default minimum dimensions if node type is unknown
 */
const DEFAULT_MIN_DIMENSIONS = { width: 300, height: 200 };

/**
 * Calculates the optimal dimensions for a parent node based on its children's positions
 * @param parentId The ID of the parent node
 * @param nodes All nodes in the graph
 * @param padding Padding to add around children (default: 20px)
 * @returns New dimensions for the parent node, or null if no resize is needed
 */
export function calculateParentNodeBounds(
  parentId: string,
  nodes: DependencyNode[],
  padding: number = 20
): { width: number; height: number } | null {
  logger.debug(`Calculating bounds for parent: ${parentId}`);

  // Find the parent node
  const parentNode = nodes.find((n) => n.id === parentId);
  if (!parentNode) {
    logger.warn(`Parent node not found: ${parentId}`);
    return null;
  }

  // Find all children of this parent
  const children = nodes.filter((n) => n.parentNode === parentId);
  if (children.length === 0) {
    logger.debug(`No children found for parent: ${parentId}`);
    return null;
  }

  logger.debug(`Found ${children.length} children for parent: ${parentId}`);

  // Calculate the bounding box that contains all children
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const child of children) {
    const childX = child.position.x;
    const childY = child.position.y;

    // Get child dimensions (from measured, explicit, or defaults)
    const childWidth = getNodeWidth(child);
    const childHeight = getNodeHeight(child);

    // Update bounding box
    minX = Math.min(minX, childX);
    minY = Math.min(minY, childY);
    maxX = Math.max(maxX, childX + childWidth);
    maxY = Math.max(maxY, childY + childHeight);
  }

  // Calculate required dimensions with padding
  const requiredWidth = maxX - minX + padding * 2;
  const requiredHeight = maxY - minY + padding * 2;

  logger.debug(`Required dimensions (with padding): ${requiredWidth} x ${requiredHeight}`);

  // Use much smaller minimums to allow parent nodes to shrink
  const minWidth = 100;
  const minHeight = 80;

  // Apply minimum size constraints (only to prevent collapse to zero)
  const finalWidth = Math.max(requiredWidth, minWidth);
  const finalHeight = Math.max(requiredHeight, minHeight);

  logger.debug(`Final dimensions (with minimums): ${finalWidth} x ${finalHeight}`);

  return {
    width: finalWidth,
    height: finalHeight,
  };
}

/**
 * Get the width of a node from various possible sources
 */
function getNodeWidth(node: DependencyNode): number {
  // Check measured dimensions first (from VueFlow DOM measurements)
  const nodeWithMeasured = node as unknown as { measured?: { width?: number; height?: number } };
  if (nodeWithMeasured.measured?.width !== undefined) {
    return nodeWithMeasured.measured.width;
  }

  // Check explicit width
  if (typeof node.width === 'number') {
    return node.width;
  }

  // Default fallback based on type
  return getDefaultWidth(node.type);
}

/**
 * Get the height of a node from various possible sources
 */
function getNodeHeight(node: DependencyNode): number {
  // Check measured dimensions first (from VueFlow DOM measurements)
  const nodeWithMeasured = node as unknown as { measured?: { width?: number; height?: number } };
  if (nodeWithMeasured.measured?.height !== undefined) {
    return nodeWithMeasured.measured.height;
  }

  // Check explicit height
  if (typeof node.height === 'number') {
    return node.height;
  }

  // Default fallback based on type
  return getDefaultHeight(node.type);
}

/**
 * Get default width for a node type
 */
function getDefaultWidth(nodeType: string | undefined): number {
  const defaults: Record<string, number> = {
    package: 600,
    module: 300,
    group: 400,
    class: 280,
    interface: 280,
    enum: 200,
    type: 200,
  };
  return defaults[String(nodeType)] || 280;
}

/**
 * Get default height for a node type
 */
function getDefaultHeight(nodeType: string | undefined): number {
  const defaults: Record<string, number> = {
    package: 400,
    module: 200,
    group: 300,
    class: 120,
    interface: 120,
    enum: 100,
    type: 80,
  };
  return defaults[String(nodeType)] || 100;
}
