import { useCallback, useState } from 'react';

import { Box, Button, TextField } from '@mui/material';
import { Panel } from '@xyflow/react';

import { graphSearchStyles } from '../../../theme/graphTheme';

import type { Edge } from '@xyflow/react';
import type { JSX } from 'react';

import type { DependencyNode } from '../types';

interface GraphSearchProps {
  nodes: DependencyNode[];
  edges: Edge[];
  onSearchResult?: (result: SearchResult) => void;
}

interface SearchResult {
  nodes: DependencyNode[];
  edges: Edge[];
  path?: DependencyNode[];
}

export function GraphSearch({ nodes, edges, onSearchResult }: GraphSearchProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback(() => {
    if (!searchQuery) {
      onSearchResult?.({ nodes: [], edges: [], path: [] });
      return;
    }

    const matchingNodes = nodes.filter((node) => node.data.label.toLowerCase().includes(searchQuery.toLowerCase()));

    const relatedEdges = edges.filter((edge) =>
      matchingNodes.some((node) => node.id === edge.source || node.id === edge.target)
    );

    onSearchResult?.({
      nodes: matchingNodes,
      edges: relatedEdges,
      path: matchingNodes,
    });
  }, [searchQuery, nodes, edges, onSearchResult]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  return (
    <Panel position="top-left">
      <Box sx={graphSearchStyles.container}>
        <TextField
          size="small"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          sx={graphSearchStyles.input}
        />
        <Button variant="outlined" size="small" onClick={handleSearch} sx={graphSearchStyles.button}>
          Search
        </Button>
      </Box>
    </Panel>
  );
}
