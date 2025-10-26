<template>
  <g class="enhanced-edge" :class="edgeClasses">
    <!-- Edge path -->
    <path
      :d="edgePath"
      :stroke="edgeColor"
      :stroke-width="edgeThickness"
      :fill="edgeFill"
      :stroke-dasharray="strokeDashArray"
      :stroke-dashoffset="strokeDashOffset"
      :filter="edgeFilter"
      :opacity="edgeOpacity"
      class="edge-path"
      :style="edgeStyle"
    />

    <!-- Edge animation overlay -->
    <path
      v-if="showAnimation"
      :d="edgePath"
      :stroke="animationColor"
      :stroke-width="animationThickness"
      :fill="'none'"
      :stroke-dasharray="animationDashArray"
      :stroke-dashoffset="animationDashOffset"
      :opacity="animationOpacity"
      class="edge-animation"
    />

    <!-- Edge label -->
    <text
      v-if="showLabel"
      :x="labelPosition.x"
      :y="labelPosition.y"
      :fill="labelColor"
      :font-size="labelFontSize"
      :font-weight="labelFontWeight"
      class="edge-label"
      text-anchor="middle"
    >
      {{ edgeLabel }}
    </text>

    <!-- Edge arrow marker -->
    <defs>
      <marker
        :id="`arrow-${edge.id}`"
        :markerWidth="arrowSize"
        :markerHeight="arrowSize"
        :refX="arrowRefX"
        :refY="arrowRefY"
        :orient="'auto'"
        :markerUnits="'strokeWidth'"
      >
        <path :d="arrowPath" :fill="edgeColor" :stroke="edgeColor" :stroke-width="arrowStrokeWidth" />
      </marker>
    </defs>
  </g>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

import type { EnhancedEdge } from '../visualization/edgeVisualization';

interface Props {
  edge: EnhancedEdge;
  sourceNode: { x: number; y: number; width: number; height: number };
  targetNode: { x: number; y: number; width: number; height: number };
  showLabel?: boolean;
  showAnimation?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: false,
  showAnimation: true,
});

const animationProgress = ref(0);
const animationFrame = ref<number | null>(null);

// Computed properties for edge styling
const edgeClasses = computed(() => {
  const classes = ['edge'];
  if (props.edge.bundleId) classes.push('bundled');
  if (props.edge.animation) classes.push('animated');
  if (props.edge.gradient) classes.push('gradient');
  if (props.edge.shadow) classes.push('shadow');
  if (props.edge.glow) classes.push('glow');
  return classes;
});

const edgePath = computed(() => {
  const source = props.sourceNode;
  const target = props.targetNode;

  // Calculate connection points
  const sourceX = source.x + source.width / 2;
  const sourceY = source.y + source.height / 2;
  const targetX = target.x + target.width / 2;
  const targetY = target.y + target.height / 2;

  // Create curved path
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const controlOffset = Math.abs(targetX - sourceX) * 0.3;

  return `M ${sourceX} ${sourceY} Q ${midX + controlOffset} ${midY} ${targetX} ${targetY}`;
});

const edgeColor = computed(() => {
  if (props.edge.gradient) return 'url(#gradient)';
  return props.edge.color ?? '#61dafb';
});

const edgeThickness = computed(() => {
  return props.edge.thickness ?? 2;
});

const edgeFill = computed(() => {
  return 'none';
});

const strokeDashArray = computed(() => {
  if (props.edge.animation?.type === 'pulse') {
    return '5,5';
  }
  return 'none';
});

const strokeDashOffset = computed(() => {
  if (props.edge.animation?.type === 'pulse') {
    return animationProgress.value * 10;
  }
  return 0;
});

const edgeFilter = computed(() => {
  const filters = [];
  if (props.edge.shadow) filters.push('drop-shadow');
  if (props.edge.glow) filters.push('glow');
  return filters.length > 0 ? `url(#${filters.join('-')})` : 'none';
});

const edgeOpacity = computed(() => {
  return 0.6 + (props.edge.strength ?? 0) * 0.4;
});

const edgeStyle = computed(() => {
  const style: Record<string, string> = {};

  if (props.edge.gradient) {
    style['background'] = props.edge.gradient;
  }

  if (props.edge.shadow) {
    style['boxShadow'] = props.edge.shadow;
  }

  if (props.edge.glow) {
    style['filter'] = props.edge.glow;
  }

  return style;
});

// Animation properties
const showAnimation = computed(() => {
  return props.showAnimation && props.edge.animation !== undefined;
});

const animationColor = computed(() => {
  return props.edge.color ?? '#61dafb';
});

const animationThickness = computed(() => {
  return (props.edge.thickness ?? 2) * 0.5;
});

const animationDashArray = computed(() => {
  if (props.edge.animation?.type === 'flow') {
    return '10,5';
  }
  return 'none';
});

const animationDashOffset = computed(() => {
  if (props.edge.animation?.type === 'flow') {
    return animationProgress.value * 15;
  }
  return 0;
});

const animationOpacity = computed(() => {
  return 0.3 + Math.sin(animationProgress.value * Math.PI * 2) * 0.3;
});

// Label properties
const showLabel = computed(() => {
  return props.showLabel && props.edge.label;
});

const edgeLabel = computed(() => {
  return props.edge.label ?? '';
});

const labelPosition = computed(() => {
  const source = props.sourceNode;
  const target = props.targetNode;

  const x = (source.x + target.x) / 2;
  const y = (source.y + target.y) / 2;

  return { x, y };
});

const labelColor = computed(() => {
  return '#333';
});

const labelFontSize = computed(() => {
  return 12;
});

const labelFontWeight = computed(() => {
  return '500';
});

// Arrow properties
const arrowSize = computed(() => {
  return Math.max(8, (props.edge.thickness ?? 1) * 2);
});

const arrowRefX = computed(() => {
  return arrowSize.value;
});

const arrowRefY = computed(() => {
  return arrowSize.value / 2;
});

const arrowPath = computed(() => {
  const size = arrowSize.value;
  return `M 0,0 L ${size},${size / 2} L 0,${size} Z`;
});

const arrowStrokeWidth = computed(() => {
  return 1;
});

// Animation loop
const animate = () => {
  animationProgress.value += 0.02;
  if (animationProgress.value > 1) {
    animationProgress.value = 0;
  }
  animationFrame.value = requestAnimationFrame(animate);
};

onMounted(() => {
  if (showAnimation.value) {
    animate();
  }
});

onUnmounted(() => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
  }
});
</script>

<style scoped>
@import 'tailwindcss' reference;

.enhanced-edge {
  @apply cursor-pointer transition-all duration-300;
}

.enhanced-edge:hover {
  @apply opacity-80;
}

.edge-path {
  @apply transition-all duration-300;
}

.edge-animation {
  @apply pointer-events-none;
  animation: flow 2s linear infinite;
}

.edge-label {
  @apply pointer-events-none select-none;
}

.bundled .edge-path {
  stroke-dasharray: 2, 2;
}

.animated .edge-path {
  animation: pulse 1.5s ease-in-out infinite;
}

.gradient .edge-path {
  background: linear-gradient(90deg, transparent, currentColor, transparent);
}

.shadow .edge-path {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.glow .edge-path {
  filter: drop-shadow(0 0 8px currentColor);
}

@keyframes flow {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 15;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}
</style>
