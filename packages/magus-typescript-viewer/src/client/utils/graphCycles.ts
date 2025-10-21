import type { DependencyEdgeKind, DependencyNode, GraphEdge } from '../components/DependencyGraph/types';

interface DetectCyclesOptions {
  edgeTypes?: DependencyEdgeKind[];
}

export interface CycleDetectionResult {
  // Strongly connected components (SCCs) as arrays of node IDs
  sccs: string[][];
  // Node IDs that are part of at least one cycle (SCC size > 1 or self-loop)
  nodeIdsInCycles: Set<string>;
  // Edge IDs that are part of at least one cycle (both endpoints cyclic or self-loop)
  edgeIdsInCycles: Set<string>;
}

/**
 * Build adjacency list for the directed graph using filtered edge types
 */
function buildAdjacency(
  nodes: DependencyNode[],
  edges: GraphEdge[],
  edgeTypes: Set<DependencyEdgeKind>
): Map<string, string[]> {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const adj = new Map<string, string[]>();

  // Initialize adjacency for all nodes
  nodeIds.forEach((id) => adj.set(id, []));

  for (const e of edges) {
    const type = e.data?.type ?? 'dependency';
    if (!edgeTypes.has(type)) continue;
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
    // Skip invalid edges
    if (typeof e.source !== 'string' || typeof e.target !== 'string') continue;
    const list = adj.get(e.source);
    if (list) list.push(e.target);
  }

  return adj;
}

/**
 * Tarjan's algorithm for strongly connected components
 */
function tarjanScc(adj: Map<string, string[]>): string[][] {
  let index = 0;
  const stack: string[] = [];
  const onStack = new Set<string>();
  const indices = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const sccs: string[][] = [];

  const strongConnect = (v: string): void => {
    indices.set(v, index);
    lowlink.set(v, index);
    index += 1;
    stack.push(v);
    onStack.add(v);

    const neighbors = adj.get(v) ?? [];
    for (const w of neighbors) {
      if (!indices.has(w)) {
        strongConnect(w);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(w)!));
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (lowlink.get(v)! === indices.get(v)!) {
      const component: string[] = [];
      while (true) {
        const w = stack.pop();
        if (w === undefined) break;
        onStack.delete(w);
        component.push(w);
        if (w === v) break;
      }
      sccs.push(component);
    }
  };

  for (const v of adj.keys()) {
    if (!indices.has(v)) strongConnect(v);
  }

  return sccs;
}

/**
 * Detect cycles in the directed graph using SCCs.
 * Cycles are SCCs with size > 1, plus any node with a self-loop edge.
 */
export function detectCycles(
  nodes: DependencyNode[],
  edges: GraphEdge[],
  options: DetectCyclesOptions = {}
): CycleDetectionResult {
  const allowed = new Set<DependencyEdgeKind>(options.edgeTypes ?? ['import']);
  const adj = buildAdjacency(nodes, edges, allowed);
  const sccs = tarjanScc(adj);

  const nodeIdsInCycles = new Set<string>();
  sccs.forEach((comp) => {
    if (comp.length > 1) comp.forEach((id) => nodeIdsInCycles.add(id));
  });

  // Self-loop detection: single-node SCCs may or may not be cycles; check explicit self-loop edges
  const nodeIdSet = new Set(nodes.map((n) => n.id));
  for (const e of edges) {
    const type = e.data?.type ?? 'dependency';
    if (!allowed.has(type)) continue;
    if (e.source === e.target && nodeIdSet.has(e.source)) {
      nodeIdsInCycles.add(e.source);
    }
  }

  // Compute edge IDs in cycles (both endpoints in cyclic set, or self-loop)
  const edgeIdsInCycles = new Set<string>();
  for (const e of edges) {
    const type = e.data?.type ?? 'dependency';
    if (!allowed.has(type)) continue;
    if (e.source === e.target) {
      edgeIdsInCycles.add(e.id);
      continue;
    }
    if (nodeIdsInCycles.has(e.source) && nodeIdsInCycles.has(e.target)) {
      edgeIdsInCycles.add(e.id);
    }
  }

  return { sccs, nodeIdsInCycles, edgeIdsInCycles };
}
