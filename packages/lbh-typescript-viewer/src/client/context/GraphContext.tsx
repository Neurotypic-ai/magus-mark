import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { DependencyNode, GraphEdge } from '../components/DependencyGraph/types';

/**
 * Graph state context interface
 */
interface GraphState {
  nodes: DependencyNode[];
  edges: GraphEdge[];
  selectedNode: DependencyNode | null;
  setNodes: React.Dispatch<React.SetStateAction<DependencyNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<GraphEdge[]>>;
  setSelectedNode: React.Dispatch<React.SetStateAction<DependencyNode | null>>;
  cacheKey: string | null;
  setCacheKey: React.Dispatch<React.SetStateAction<string | null>>;
  clearCache: () => void;
}

// Create context with default values
const GraphContext = createContext<GraphState>({
  nodes: [],
  edges: [],
  selectedNode: null,
  setNodes: () => {
    throw new Error('setNodes not implemented');
  },
  setEdges: () => {
    throw new Error('setEdges not implemented');
  },
  setSelectedNode: () => {
    throw new Error('setSelectedNode not implemented');
  },
  cacheKey: null,
  setCacheKey: () => {
    throw new Error('setCacheKey not implemented');
  },
  clearCache: () => {
    throw new Error('clearCache not implemented');
  },
});

// Cache keys for local storage
const NODES_CACHE_KEY = 'typescript-viewer-nodes';
const EDGES_CACHE_KEY = 'typescript-viewer-edges';

/**
 * Provider component for graph state
 */
export const GraphProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [nodes, setNodes] = useState<DependencyNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<DependencyNode | null>(null);
  const [cacheKey, setCacheKey] = useState<string | null>(null);

  // Load cached data from localStorage on initial render
  useEffect(() => {
    try {
      const cachedNodesJson = localStorage.getItem(NODES_CACHE_KEY);
      const cachedEdgesJson = localStorage.getItem(EDGES_CACHE_KEY);

      if (cachedNodesJson && cachedEdgesJson) {
        const cachedNodes = JSON.parse(cachedNodesJson) as DependencyNode[];
        const cachedEdges = JSON.parse(cachedEdgesJson) as GraphEdge[];

        setNodes(cachedNodes);
        setEdges(cachedEdges);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.info('Failed to load cached graph data:', error);
      // Continue with empty state if cache load fails
    }
  }, []);

  // Update cache when nodes or edges change and we have a cache key
  useEffect(() => {
    if (!cacheKey) return;

    try {
      if (nodes.length > 0) {
        localStorage.setItem(NODES_CACHE_KEY, JSON.stringify(nodes));
      }

      if (edges.length > 0) {
        localStorage.setItem(EDGES_CACHE_KEY, JSON.stringify(edges));
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.info('Failed to cache graph data:', error);
    }
  }, [nodes, edges, cacheKey]);

  // Clear the cache
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(NODES_CACHE_KEY);
      localStorage.removeItem(EDGES_CACHE_KEY);
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
      setCacheKey(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.info('Failed to clear graph cache:', error);
    }
  }, []);

  return (
    <GraphContext.Provider
      value={{
        nodes,
        setNodes,
        edges,
        setEdges,
        selectedNode,
        setSelectedNode,
        cacheKey,
        setCacheKey,
        clearCache,
      }}
    >
      {children}
    </GraphContext.Provider>
  );
};

/**
 * Hook to use graph state
 * @returns Graph state and methods
 */
export const useGraphState = (): GraphState => {
  return useContext(GraphContext);
};
