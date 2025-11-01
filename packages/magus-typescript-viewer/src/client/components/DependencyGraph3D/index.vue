<script setup lang="ts">
import ForceGraph3D from '3d-force-graph';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, ref, watch } from 'vue';

import { createLogger } from '../../../shared/utils/logger';
import { useGraphSettings } from '../../stores/graphSettings';
import { useGraphStore } from '../../stores/graphStore';
import { getEdgeStyle, getNodeStyle } from '../../theme/graphTheme';

import type {
  DependencyKind,
  DependencyNode,
  DependencyPackageGraph,
  GraphEdge,
} from '../DependencyGraph/types';

const graphLogger = createLogger('DependencyGraph3D');

export interface DependencyGraph3DProps {
  data: DependencyPackageGraph;
}

defineProps<DependencyGraph3DProps>();

// Get graph state from Pinia store
const graphStore = useGraphStore();
const graphSettings = useGraphSettings();
const { nodes, edges } = storeToRefs(graphStore);

// Container ref
const containerRef = ref<HTMLDivElement | null>(null);
const isInitialized = ref(false);
const isInitializing = ref(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let graphInstance: any = null;

// Convert graph data to 3d-force-graph format
const convertTo3DGraphData = () => {
  const graphData = {
    nodes: nodes.value.map((node: DependencyNode) => {
      const nodeType = (node.type as DependencyKind) || 'class';
      const style = getNodeStyle(nodeType);
      const sizeVal = nodeType === 'package' ? 10 : nodeType === 'module' ? 5 : 3;
      return {
        id: node.id,
        name: node.data?.label || node.id,
        nodeType,
        color: ((style as Record<string, unknown>)['backgroundColor'] as string) || '#1a1a1a',
        val: sizeVal,
        data: node.data,
      };
    }),
    links: edges.value.map((edge: GraphEdge) => {
      const edgeType = edge.data?.type || 'dependency';
      const style = getEdgeStyle(edgeType);
      return {
        source: edge.source,
        target: edge.target,
        color: (style as Record<string, unknown>)['stroke'] as string || '#61dafb',
        linkType: edgeType,
      };
    }),
  };

  graphLogger.info(`Converted graph data: ${graphData.nodes.length} nodes, ${graphData.links.length} links`);
  return graphData;
};

// Initialize 3D graph
const initializeGraph = () => {
  if (isInitializing.value) {
    graphLogger.warn('Already initializing, skipping...');
    return;
  }

  if (!containerRef.value) {
    graphLogger.warn('Container not ready');
    return;
  }

  graphLogger.info('Container dimensions:', {
    width: containerRef.value.clientWidth,
    height: containerRef.value.clientHeight,
  });

  if (containerRef.value.clientWidth === 0 || containerRef.value.clientHeight === 0) {
    graphLogger.warn('Container has zero dimensions, retrying...');
    setTimeout(initializeGraph, 100);
    return;
  }

  isInitializing.value = true;

  if (graphInstance) {
    graphLogger.info('Cleaning up existing graph instance');
    try {
      // Clear the container before destroying
      if (containerRef.value) {
        containerRef.value.innerHTML = '';
      }
      graphInstance._destructor();
    } catch (e) {
      graphLogger.warn('Error cleaning up graph instance:', e);
    }
    graphInstance = null;
  }

  graphLogger.info('Initializing 3D Force Graph');
  const graphData = convertTo3DGraphData();

  if (graphData.nodes.length === 0) {
    graphLogger.warn('No nodes to display, waiting for data...');
    isInitializing.value = false;
    return;
  }

  try {
    // Create the graph instance
    // @ts-expect-error - ForceGraph3D types are not perfect
    graphInstance = ForceGraph3D()(containerRef.value);

    graphInstance
      .graphData(graphData)
      .nodeLabel((node: any) => `
        <div style="background: rgba(0,0,0,0.8); padding: 8px; border-radius: 4px; color: white; font-size: 12px;">
          <div style="font-weight: bold; margin-bottom: 4px;">${node.name}</div>
          <div style="font-size: 10px; color: #61dafb;">Type: ${node.nodeType}</div>
        </div>
      `)
      .nodeColor('color')
      .nodeVal('val')
      .nodeOpacity(0.9)
      .linkColor('color')
      .linkWidth(1.5)
      .linkOpacity(0.6)
      .linkDirectionalParticles(4)
      .linkDirectionalParticleWidth(2)
      .linkDirectionalParticleSpeed(0.005)
      .linkDirectionalArrowLength(3.5)
      .linkDirectionalArrowRelPos(1)
      .backgroundColor('#0a0e27')
      .onNodeClick((node: any) => {
        graphLogger.info(`Node clicked: ${node.id}`);
        graphStore.setSelectedNode(node as DependencyNode);
      })
      .onNodeHover((node: any) => {
        if (containerRef.value) {
          containerRef.value.style.cursor = node ? 'pointer' : 'default';
        }
      })
      .width(containerRef.value.clientWidth)
      .height(containerRef.value.clientHeight)
      .enableNodeDrag(true)
      .enableNavigationControls(true)
      .showNavInfo(false);

    // Apply camera preset
    applyCameraPreset();

    isInitialized.value = true;
    isInitializing.value = false;
    graphLogger.info('3D Force Graph initialized successfully');
  } catch (error) {
    graphLogger.error('Failed to initialize 3D graph:', error);
    isInitialized.value = false;
    isInitializing.value = false;
  }
};

// Apply camera preset
const applyCameraPreset = () => {
  if (!graphInstance) return;

  const distance = 1000;
  const cameraPos = graphSettings.camera3DPosition;

  switch (graphSettings.cameraPreset) {
    case 'top':
      graphInstance.cameraPosition({ x: 0, y: distance, z: 0 });
      break;
    case 'front':
      graphInstance.cameraPosition({ x: 0, y: 0, z: distance });
      break;
    case 'side':
      graphInstance.cameraPosition({ x: distance, y: 0, z: 0 });
      break;
    case 'isometric':
      graphInstance.cameraPosition({ x: distance, y: distance, z: distance });
      break;
    case 'free':
      graphInstance.cameraPosition(cameraPos);
      break;
  }
};

// Watch for data changes
watch(
  () => [nodes.value, edges.value],
  () => {
    if (graphInstance) {
      graphLogger.info('Graph data changed, updating 3D graph');
      const graphData = convertTo3DGraphData();
      graphInstance.graphData(graphData);
    } else if (nodes.value.length > 0) {
      // If we have data but no graph instance, try to initialize
      graphLogger.info('Data available but no graph instance, initializing...');
      initializeGraph();
    }
  },
  { deep: true }
);

// Watch for camera preset changes
watch(
  () => graphSettings.cameraPreset,
  () => {
    applyCameraPreset();
  }
);

// Handle window resize
const handleResize = () => {
  if (graphInstance && containerRef.value) {
    graphInstance.width(containerRef.value.clientWidth).height(containerRef.value.clientHeight);
  }
};

onMounted(() => {
  graphLogger.info('Component mounted, nodes:', nodes.value.length, 'edges:', edges.value.length);
  // Wait for next tick to ensure DOM is ready
  setTimeout(() => {
    initializeGraph();
  }, 100);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (graphInstance) {
    try {
      // Clear the container before destroying
      if (containerRef.value) {
        containerRef.value.innerHTML = '';
      }
      graphInstance._destructor();
    } catch (e) {
      graphLogger.warn('Error during unmount cleanup:', e);
    }
    graphInstance = null;
  }
  isInitialized.value = false;
});
</script>

<template>
  <div ref="containerRef" class="graph-3d-container">
    <div v-if="!isInitialized" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">Initializing 3D Graph...</p>
    </div>
  </div>
</template>

<style scoped>
.graph-3d-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(10, 14, 39, 0.9);
  z-index: 10;
  pointer-events: none;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(97, 218, 251, 0.3);
  border-top-color: #61dafb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 20px;
  color: #61dafb;
  font-size: 14px;
  font-weight: 500;
}
</style>
