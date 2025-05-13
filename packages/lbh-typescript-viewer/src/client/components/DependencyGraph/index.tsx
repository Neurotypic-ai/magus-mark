import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { Background, ReactFlow, applyEdgeChanges, applyNodeChanges, useReactFlow } from '@xyflow/react';

import { createLogger } from '../../../shared/utils/logger';
import { useGraphState } from '../../context/GraphContext';
import { WebWorkerLayoutProcessor } from '../../layout/WebWorkerLayoutProcessor';
import { getEdgeStyle, getNodeStyle, graphTheme } from '../../theme/graphTheme';
import { createGraphEdges } from '../../utils/createGraphEdges';
import { createGraphNodes } from '../../utils/createGraphNodes';
import { measurePerformance } from '../../utils/performanceMonitoring';
import { GraphControls } from './components/GraphControls';
import { GraphSearch } from './components/GraphSearch';
import NodeDetails from './components/NodeDetails';
import { mapTypeCollection } from './mapTypeCollection';
import { nodeTypes } from './nodes/nodes';

import type { Edge, EdgeChange, Node, NodeChange, OnEdgesChange, OnNodesChange } from '@xyflow/react';
import type { CSSProperties } from 'react';

import type { Method } from '../../../shared/types/Method';
import type { Property } from '../../../shared/types/Property';
import type { TypeCollection } from '../../../shared/types/TypeCollection';
import type { DependencyKind, DependencyNode, DependencyPackageGraph, GraphEdge, SearchResult } from './types';

import '@xyflow/react/dist/style.css';

const graphLogger = createLogger('DependencyGraph');

/**
 * Creates member properties and methods from entity data
 */
export function getMembersAsProperties(entity: {
  properties: TypeCollection<Property>;
  methods: TypeCollection<Method>;
  name: string;
  id: string;
}) {
  return {
    properties: mapTypeCollection(entity.properties, (prop: Property) => ({
      name: prop.name,
      type: prop.type,
      visibility: prop.visibility,
    })),
    methods: mapTypeCollection(entity.methods, (method: Method) => {
      const parameters = mapTypeCollection(method.parameters, (param) => `${param.name}: ${param.type}`);
      return {
        name: method.name,
        type: method.return_type,
        visibility: `${method.is_static ? 'static ' : ''}${method.visibility}`,
        returnType: method.return_type,
        signature: parameters.join(', '),
      };
    }),
  };
}

export interface DependencyGraphProps {
  data: DependencyPackageGraph;
}

/**
 * DependencyGraph component that visualizes TypeScript dependency relationships
 */
export function DependencyGraph({ data }: DependencyGraphProps) {
  // Get graph state from context with proper type assertions
  const context = useGraphState();
  const nodes = context.nodes;
  const edges = context.edges;
  const selectedNode = context.selectedNode;
  const setNodes = context.setNodes;
  const setEdges = context.setEdges;
  const setSelectedNode = context.setSelectedNode;

  const { fitView } = useReactFlow();

  // Keep a reference to the layout processor for cleanup
  const layoutProcessorRef = useRef<WebWorkerLayoutProcessor | null>(null);

  // Create WebWorkerLayoutProcessor with memoization
  const layoutProcessor = useMemo(() => {
    // Clean up previous instance if it exists
    if (layoutProcessorRef.current) {
      layoutProcessorRef.current.dispose();
    }

    // Create a new instance
    const processor = new WebWorkerLayoutProcessor({
      theme: graphTheme,
      animationDuration: 300,
    });

    // Store the reference
    layoutProcessorRef.current = processor;

    return processor;
  }, []);

  // Clean up the worker when component unmounts
  useEffect(() => {
    return () => {
      if (layoutProcessorRef.current) {
        layoutProcessorRef.current.dispose();
        layoutProcessorRef.current = null;
      }
    };
  }, []);

  // Process graph layout using web worker
  const processGraphLayout = useCallback(
    async (graphData: { nodes: DependencyNode[]; edges: GraphEdge[] }) => {
      try {
        // Start performance measurement
        performance.mark('layout-start');

        // Process layout using the web worker
        const result = await layoutProcessor.processLayout(graphData);

        // Force the correct types for nodes and edges
        const typedNodes = result.nodes as unknown as DependencyNode[];
        const typedEdges = result.edges as unknown as GraphEdge[];

        // Update nodes with animation
        setNodes(
          typedNodes.map((node) => ({
            ...node,
            // Add transition style for smooth animation
            style: {
              ...node.style,
              transition: `all 300ms ease-in-out`,
            },
          }))
        );

        setEdges(typedEdges);

        // Fit view after layout
        await fitView({ duration: 300 });

        // End performance measurement
        performance.mark('layout-end');
        measurePerformance('graph-layout', 'layout-start', 'layout-end');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        graphLogger.error('Layout processing failed:', error);
      }
    },
    [layoutProcessor, fitView, setNodes, setEdges]
  );

  // Initialize graph
  useEffect(() => {
    const initializeGraph = async () => {
      performance.mark('graph-init-start');

      // Create nodes and edges using extracted utilities
      const graphNodes = createGraphNodes(data);
      const graphEdges = createGraphEdges(data) as unknown as GraphEdge[];

      // Process initial layout
      await processGraphLayout({ nodes: graphNodes, edges: graphEdges });

      performance.mark('graph-init-end');
      measurePerformance('graph-initialization', 'graph-init-start', 'graph-init-end');
    };

    void initializeGraph();
  }, [data, processGraphLayout]);

  // Node click handler - use unknown then cast to fix type issues
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: unknown) => {
      setSelectedNode(node as DependencyNode);
    },
    [setSelectedNode]
  );

  // Filter handler for relationship types
  const handleRelationshipFilterChange = useCallback(
    (types: string[]) => {
      setEdges((currentEdges) =>
        currentEdges.map((edge) => ({
          ...edge,
          hidden: !types.includes(edge.type! ?? 'default'),
        }))
      );
    },
    [setEdges]
  );

  // Search result handler
  const handleSearchResult = useCallback(
    (result: SearchResult) => {
      // Update node styling based on search results
      setNodes((currentNodes) =>
        currentNodes.map((node) => ({
          ...node,
          selected: result.nodes.some((searchNode) => searchNode.id === node.id),
          style: {
            ...getNodeStyle(node.type as DependencyKind),
            opacity:
              result.nodes.length === 0 ? 1 : result.nodes.some((searchNode) => searchNode.id === node.id) ? 1 : 0.2,
          } as CSSProperties,
        }))
      );

      // Update edge styling based on search results
      setEdges((currentEdges) =>
        currentEdges.map((edge) => ({
          ...edge,
          selected: result.edges.some((searchEdge) => searchEdge.id === edge.id),
          style: {
            ...getEdgeStyle((edge.type as DependencyKind) ?? 'dependency'),
            opacity:
              result.edges.length === 0 ? 1 : result.edges.some((searchEdge) => searchEdge.id === edge.id) ? 1 : 0.2,
          },
        }))
      );

      // Highlight path if it exists
      if (result.path) {
        setNodes((currentNodes) =>
          currentNodes.map((node) => ({
            ...node,
            style: {
              ...getNodeStyle(node.type as DependencyKind),
              opacity: result.path?.some((pathNode) => pathNode.id === node.id) ? 1 : 0.2,
              borderWidth: result.path?.some((pathNode) => pathNode.id === node.id)
                ? graphTheme.edges.sizes.width.selected
                : graphTheme.edges.sizes.width.default,
            } as CSSProperties,
          }))
        );
      }
    },
    [setNodes, setEdges]
  );

  // Node change handler
  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds) as unknown as DependencyNode[];
        return updatedNodes;
      });
    },
    [setNodes]
  );

  // Edge change handler
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds) as unknown as GraphEdge[]);
    },
    [setEdges]
  );

  // Keyboard navigation handlers
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Handle keyboard navigation between nodes
      if (
        selectedNode &&
        (event.key === 'ArrowRight' ||
          event.key === 'ArrowLeft' ||
          event.key === 'ArrowUp' ||
          event.key === 'ArrowDown')
      ) {
        event.preventDefault();

        // Find connected nodes based on arrow direction
        const connectedEdges = edges.filter(
          (edge) => edge.source === selectedNode.id || edge.target === selectedNode.id
        );

        if (connectedEdges.length > 0) {
          // Select a connected node based on direction
          const nextNodeId =
            event.key === 'ArrowLeft' || event.key === 'ArrowUp'
              ? connectedEdges[0].source === selectedNode.id
                ? connectedEdges[0].target
                : connectedEdges[0].source
              : connectedEdges[connectedEdges.length - 1].source === selectedNode.id
                ? connectedEdges[connectedEdges.length - 1].target
                : connectedEdges[connectedEdges.length - 1].source;

          // Find the node in our nodes array
          const nextNode = nodes.find((node) => node.id === nextNodeId);
          if (nextNode) {
            setSelectedNode(nextNode);

            // Center view on the selected node
            void fitView({
              nodes: [nextNode as unknown as Node],
              duration: 300,
              padding: 0.5,
            });
          }
        }
      }
    },
    [selectedNode, edges, nodes, setSelectedNode, fitView]
  );

  // Render the component with ARIA attributes for accessibility
  return (
    <div
      style={{ height: '100%', width: '100%' }}
      role="application"
      aria-label="TypeScript dependency graph visualization"
    >
      {/* Use a standard button for keyboard controls instead of a non-interactive div */}
      <button
        className="visualization-keyboard-control"
        style={{
          height: '100%',
          width: '100%',
          outline: 'none',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'default',
          textAlign: 'left',
        }}
        onKeyDown={handleKeyDown}
        aria-label="Press arrow keys to navigate between connected nodes"
      >
        {/* The actual graph */}
        <ReactFlow
          nodes={nodes as unknown as Node[]}
          edges={edges as unknown as Edge[]}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes as unknown as Record<string, React.ComponentType<unknown>>}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        >
          <Background />
          <GraphControls onRelationshipFilterChange={handleRelationshipFilterChange} />
          <GraphSearch
            onSearchResult={handleSearchResult as unknown as (result: SearchResult) => void}
            nodes={nodes}
            edges={edges}
          />
          {selectedNode ? <NodeDetails node={selectedNode} /> : null}
        </ReactFlow>
      </button>
    </div>
  );
}
