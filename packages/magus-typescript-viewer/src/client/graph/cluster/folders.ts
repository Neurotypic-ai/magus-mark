import { createLogger } from '../../../shared/utils/logger';

import type { DependencyKind, DependencyNode, GraphEdge } from '../../components/DependencyGraph/types';

const logger = createLogger('clusterByFolder');

function getPathFromNode(node: DependencyNode): string | null {
  const props = node.data.properties;
  if (!Array.isArray(props)) return null;
  const pathProp = props.find((p) => p.name === 'path');
  return typeof pathProp?.type === 'string' ? pathProp.type : null;
}

function getDirname(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const idx = normalized.lastIndexOf('/');
  return idx > 0 ? normalized.slice(0, idx) : '';
}

/**
 * Cluster module nodes by their directory. Creates a group node per directory and re-parents modules.
 * Non-module nodes are returned unchanged.
 */
export function clusterByFolder(
  nodes: DependencyNode[],
  edges: GraphEdge[]
): { nodes: DependencyNode[]; edges: GraphEdge[] } {
  logger.info('Starting folder clustering');
  logger.debug(`Input: ${String(nodes.length)} nodes, ${String(edges.length)} edges`);

  const modules = nodes.filter((n) => n.data.type === 'module');
  logger.debug(`Found ${String(modules.length)} module nodes`);

  if (modules.length === 0) {
    logger.debug('No modules to cluster, returning unchanged');
    return { nodes, edges };
  }

  const dirToId = new Map<string, string>();
  const dirNodes: DependencyNode[] = [];

  function ensureDirNode(dir: string): string {
    if (dirToId.has(dir)) {
      return dirToId.get(dir) ?? `dir:${dir || 'root'}`;
    }
    const id = `dir:${dir || 'root'}`;
    logger.debug(`Creating directory node: ${id}`);
    dirToId.set(dir, id);
    dirNodes.push({
      group: 'nodes',
      data: {
        id,
        label: dir || 'root',
        type: 'group' as DependencyKind,
      },
      position: { x: 0, y: 0 },
      selectable: true,
      grabbable: true,
      classes: 'group-node',
    });
    return id;
  }

  logger.debug('Remapping module nodes to directory parents...');
  let remappedCount = 0;
  const remappedNodes = nodes.map((n) => {
    if (n.data.type !== 'module') return n;
    const p = getPathFromNode(n);
    if (!p) return n;
    const dir = getDirname(p);
    const parentId = ensureDirNode(dir);
    remappedCount++;
    return {
      ...n,
      data: { ...n.data, parent: parentId, parentId },
    } as DependencyNode;
  });

  logger.info(`Remapped ${String(remappedCount)} modules to ${String(dirNodes.length)} directory groups`);
  logger.debug(`Output: ${String(dirNodes.length + remappedNodes.length)} nodes, ${String(edges.length)} edges`);

  return { nodes: [...dirNodes, ...remappedNodes], edges };
}
