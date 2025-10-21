import { createLogger } from '../../../shared/utils/logger';

import type { DependencyKind, DependencyNode, GraphEdge } from '../../components/DependencyGraph/types';

const logger = createLogger('SCC');

interface StronglyConnectedComponent {
  id: string;
  memberIds: string[]; // module node ids
}

/**
 * Build adjacency list for module-level graph from edges of supported dependency kinds.
 */
function buildAdjacency(nodes: DependencyNode[], edges: GraphEdge[]): Map<string, string[]> {
  const moduleIds = new Set(nodes.filter((n) => n.data.type === 'module').map((n) => n.data.id));
  const adj = new Map<string, string[]>();
  moduleIds.forEach((id) => adj.set(id, []));

  edges.forEach((e) => {
    const type = (e.data.type as string | undefined) ?? 'dependency';
    if (!['import', 'export', 'dependency'].includes(type)) return;
    if (moduleIds.has(e.data.source) && moduleIds.has(e.data.target)) {
      adj.get(e.data.source)?.push(e.data.target);
    }
  });

  return adj;
}

/**
 * Tarjan's algorithm to compute SCCs for module graph.
 */
export function computeSccs(nodes: DependencyNode[], edges: GraphEdge[]): StronglyConnectedComponent[] {
  logger.info("Starting SCC computation with Tarjan's algorithm");
  logger.debug(`Input: ${String(nodes.length)} nodes, ${String(edges.length)} edges`);

  const adj = buildAdjacency(nodes, edges);
  logger.debug(`Built adjacency list with ${String(adj.size)} module nodes`);

  const indexMap = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Map<string, boolean>();
  const stack: string[] = [];
  let index = 0;
  const result: StronglyConnectedComponent[] = [];

  function strongConnect(v: string): void {
    indexMap.set(v, index);
    lowlink.set(v, index);
    index += 1;
    stack.push(v);
    onStack.set(v, true);

    const neighbors = adj.get(v) ?? [];
    neighbors.forEach((w) => {
      if (!indexMap.has(w)) {
        strongConnect(w);
        const lw = lowlink.get(w);
        const lv = lowlink.get(v);
        if (lw !== undefined && lv !== undefined) {
          lowlink.set(v, Math.min(lv, lw));
        }
      } else if (onStack.get(w)) {
        const iw = indexMap.get(w);
        const lv = lowlink.get(v);
        if (iw !== undefined && lv !== undefined) {
          lowlink.set(v, Math.min(lv, iw));
        }
      }
    });

    if (lowlink.get(v) === indexMap.get(v)) {
      const members: string[] = [];
      let w: string | undefined;
      do {
        w = stack.pop();
        if (w !== undefined) {
          onStack.set(w, false);
          members.push(w);
        }
      } while (w !== undefined && w !== v);

      if (members.length > 1) {
        const label = members.slice().sort().join(',');
        const sccId = `scc:${label}`;
        logger.debug(`Found SCC with ${String(members.length)} members: ${sccId}`);
        result.push({ id: sccId, memberIds: members });
      }
    }
  }

  Array.from(adj.keys()).forEach((v) => {
    if (!indexMap.has(v)) strongConnect(v);
  });

  logger.info(`Found ${String(result.length)} strongly connected components (cycles)`);
  return result;
}

/**
 * Collapse SCCs into compound "group" nodes. Modules inside SCCs become children.
 * Edges within the same SCC are removed. Inter-SCC edges are redirected to group nodes.
 */
export function collapseSccs(
  nodes: DependencyNode[],
  edges: GraphEdge[]
): { nodes: DependencyNode[]; edges: GraphEdge[] } {
  logger.info('Starting SCC collapse');
  logger.debug(`Input: ${String(nodes.length)} nodes, ${String(edges.length)} edges`);

  const sccs = computeSccs(nodes, edges);
  if (sccs.length === 0) {
    logger.debug('No SCCs found, returning unchanged');
    return { nodes, edges };
  }

  logger.debug(`Processing ${String(sccs.length)} SCCs`);
  const moduleIdToSccId = new Map<string, string>();
  sccs.forEach((scc) => {
    scc.memberIds.forEach((id) => moduleIdToSccId.set(id, scc.id));
  });
  logger.debug(`Mapped ${String(moduleIdToSccId.size)} modules to their SCCs`);

  logger.debug('Creating SCC group nodes...');
  const groupNodes: DependencyNode[] = sccs.map((scc, index) => {
    if (index < 3) {
      logger.debug(`Creating group node for SCC with ${String(scc.memberIds.length)} members`);
    }
    return {
      group: 'nodes',
      data: {
        id: scc.id,
        label: 'Cycle (' + String(scc.memberIds.length) + ')',
        type: 'group' as DependencyKind,
      },
      position: { x: 0, y: 0 },
      selectable: true,
      grabbable: true,
      classes: 'group-node',
    };
  });
  logger.debug(`Created ${String(groupNodes.length)} SCC group nodes`);

  logger.debug('Remapping nodes to SCC parents...');
  let remappedCount = 0;
  const remappedNodes: DependencyNode[] = nodes.map((n) => {
    const sccId = moduleIdToSccId.get(n.data.id);
    if (!sccId) return n;
    remappedCount++;
    return {
      ...n,
      data: { ...n.data, parent: sccId, parentId: sccId },
    } as DependencyNode;
  });
  logger.debug(`Remapped ${String(remappedCount)} nodes to SCC groups`);

  logger.debug('Processing edges...');
  const edgeMap = new Map<string, GraphEdge>();
  let droppedIntraEdges = 0;
  let remappedEdges = 0;

  edges.forEach((e) => {
    const type = (e.data.type as string | undefined) ?? 'dependency';
    const srcScc = moduleIdToSccId.get(e.data.source);
    const tgtScc = moduleIdToSccId.get(e.data.target);

    const mappedSource = srcScc ?? e.data.source;
    const mappedTarget = tgtScc ?? e.data.target;

    if (mappedSource === mappedTarget) {
      droppedIntraEdges++;
      return; // drop intra-scc edges
    }

    const key = `${mappedSource}|${mappedTarget}|${type}`;
    if (!edgeMap.has(key)) {
      edgeMap.set(key, {
        ...e,
        data: {
          ...e.data,
          id: key,
          source: mappedSource,
          target: mappedTarget,
        },
      });
      remappedEdges++;
    }
  });

  logger.info(`Dropped ${String(droppedIntraEdges)} intra-SCC edges`);
  logger.debug(`Remapped ${String(remappedEdges)} edges to inter-SCC connections`);
  logger.info(`Created ${String(edgeMap.size)} unique inter-SCC edges`);
  logger.debug(`Output: ${String(groupNodes.length + remappedNodes.length)} nodes, ${String(edgeMap.size)} edges`);

  return {
    nodes: [...groupNodes, ...remappedNodes],
    edges: Array.from(edgeMap.values()),
  };
}
