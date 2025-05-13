import { useEffect, useState } from 'react';

import type { DependencyGraph, DependencyNode } from '../types';

export function useLazyGraph(data: DependencyGraph) {
  const [visibleNodes, setVisibleNodes] = useState<DependencyNode[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setVisibleNodes(data.nodes.slice(start, end));
  }, [page, data]);

  return {
    visibleNodes,
    loadMore: () => {
      setPage((p) => p + 1);
    },
    hasMore: visibleNodes.length < data.nodes.length,
  };
}
