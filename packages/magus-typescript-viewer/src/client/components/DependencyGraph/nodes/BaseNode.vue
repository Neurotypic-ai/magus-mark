<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
import { computed } from 'vue';

import type { DependencyProps } from '../types';

interface BaseNodeProps {
  readonly id: string;
  readonly type: DependencyProps['type'];
  readonly data: DependencyProps['data'];
  readonly selected?: boolean;
  readonly targetPosition?: DependencyProps['targetPosition'];
  readonly sourcePosition?: DependencyProps['sourcePosition'];
  readonly minWidth?: string;
  readonly zIndex?: number;
  readonly badgeText: string;
  readonly badgeClass?: string;
  readonly backgroundColor?: string;
  readonly borderColor?: string;
}

const props = withDefaults(defineProps<BaseNodeProps>(), {
  minWidth: '280px',
  zIndex: 1,
});

const nodeData = computed(() => props.data);
const isSelected = computed(() => !!props.selected);

// Get handle positions from props (set by createGraphNodes based on layout direction)
// These are set dynamically by Vue Flow based on layout direction
const sourcePosition = computed(() => props.sourcePosition ?? Position.Bottom);
const targetPosition = computed(() => props.targetPosition ?? Position.Top);

// Container style
const containerStyle = computed(() => {
  const style: Record<string, string | number> = {
    zIndex: props.zIndex,
    minWidth: props.minWidth,
  };

  if (props.backgroundColor) {
    style['backgroundColor'] = props.backgroundColor;
  }

  if (props.borderColor) {
    style['borderColor'] = props.borderColor;
  }

  return style;
});
</script>

<template>
  <div :class="['base-node-container', { 'base-node-selected': isSelected }]" :style="containerStyle">
    <Handle type="target" :position="targetPosition" :key="`target-${targetPosition}`" class="base-node-handle" />

    <!-- Node Header -->
    <div class="base-node-header">
      <div class="base-node-title-container">
        <div class="base-node-title" :title="nodeData.label">
          {{ nodeData.label || 'Unnamed' }}
        </div>
      </div>
      <div :class="['base-node-badge', badgeClass]">
        {{ badgeText }}
      </div>
    </div>

    <!-- Node Content Slot -->
    <slot name="content" />

    <!-- Empty State Slot -->
    <slot name="empty" />

    <Handle type="source" :position="sourcePosition" :key="`source-${sourcePosition}`" class="base-node-handle" />
  </div>
</template>

<style scoped>
@import 'tailwindcss';

/* Base Node Container */
.base-node-container {
  @apply relative rounded-lg p-0 text-xs leading-4 cursor-move transition-all duration-200 overflow-visible;
  @apply shadow-lg;
  border: 1px solid var(--border-default);
  background-color: var(--background-node);
}

.base-node-container:hover {
  border-color: var(--border-hover);
}

.base-node-container.base-node-selected {
  border-color: var(--border-focus);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05),
    0 0 12px rgba(144, 202, 249, 0.4);
}

/* Node Handles */
.base-node-handle {
  @apply w-3 h-3;
  width: 0.75rem !important;
  height: 0.75rem !important;
}

/* Node Header */
.base-node-header {
  @apply flex items-center gap-2 px-3 py-2;
  border-bottom: 1px solid var(--border-default);
}

.base-node-title-container {
  @apply flex-1 min-w-0 px-1;
}

.base-node-title {
  @apply font-semibold text-sm leading-5 overflow-hidden text-ellipsis whitespace-nowrap;
  color: var(--text-primary);
}

.base-node-badge {
  @apply px-2 py-1 rounded text-[0.625rem] uppercase tracking-wide font-bold shrink-0;
  color: var(--text-secondary);
}

/* Shared Animations */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-in-from-top {
  from {
    transform: translateY(-8px);
  }
  to {
    transform: translateY(0);
  }
}
</style>
