<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
import { computed, ref } from 'vue';

import type { DependencyProps } from '../types';

const props = defineProps<DependencyProps>();

const nodeData = computed(() => props.data);
const isSelected = computed(() => !!props.selected);

// Get handle positions from props (set by createGraphNodes based on layout direction)
const sourcePosition = computed(() => props.sourcePosition ?? Position.Bottom);
const targetPosition = computed(() => props.targetPosition ?? Position.Top);

// Collapsible sections state
const isMetadataExpanded = ref(true);

const toggleMetadata = () => {
  isMetadataExpanded.value = !isMetadataExpanded.value;
};

const containerClasses = computed(() => {
  const baseClasses = [
    'relative',
    'rounded',
    'border',
    'transition-all',
    'duration-200',
    'cursor-move',
    'shadow-lg',
    'text-xs',
    'bg-background-node',
    'z-[1]',
    'min-w-[280px]',
    'max-w-[400px]',
  ];

  const borderClass = isSelected.value
    ? 'border-border-focus shadow-[0_0_12px_rgba(144,202,249,0.4)]'
    : 'border-border-default hover:border-border-hover';

  return [...baseClasses, borderClass].join(' ');
});
</script>

<template>
  <div :class="containerClasses">
    <Handle type="target" :position="targetPosition" class="!w-3 !h-3" />

    <!-- Node Header -->
    <div class="flex items-center gap-2 border-b border-border-default p-3 bg-white/5">
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-sm text-text-primary truncate" :title="nodeData.label">
          {{ nodeData.label || 'Unnamed Module' }}
        </div>
      </div>
      <div
        class="px-2 py-1 bg-white/10 rounded text-text-secondary text-[10px] uppercase tracking-wider font-bold flex-shrink-0"
      >
        MODULE
      </div>
    </div>

    <!-- Module Metadata Section -->
    <div v-if="nodeData.properties && nodeData.properties.length > 0" class="border-b border-border-default/50">
      <!-- Collapsible Header -->
      <button
        class="w-full flex items-center justify-between p-2 px-3 hover:bg-white/5 transition-colors text-left"
        @click="toggleMetadata"
        type="button"
        :aria-expanded="isMetadataExpanded"
        aria-label="Toggle metadata section"
      >
        <span class="text-text-secondary text-[10px] font-bold uppercase tracking-wide">Metadata</span>
        <svg
          class="w-3 h-3 text-text-secondary transition-transform duration-200"
          :class="{ 'rotate-180': isMetadataExpanded }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Collapsible Content -->
      <div
        v-show="isMetadataExpanded"
        class="flex flex-col gap-1 px-3 pb-3 animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div
          v-for="(prop, index) in nodeData.properties"
          :key="index"
          class="flex items-start gap-2 text-xs p-1.5 rounded hover:bg-white/5 transition-colors"
        >
          <span class="font-semibold text-text-secondary flex-shrink-0 min-w-[50px]">{{ prop.name }}:</span>
          <span class="text-text-primary break-all" :title="prop.type">{{ prop.type }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="p-4 text-center text-text-secondary text-xs italic opacity-60">No metadata available</div>

    <Handle type="source" :position="sourcePosition" class="!w-3 !h-3" />
  </div>
</template>

<style scoped>
/* Smooth animations */
.transition-fast {
  transition: all 150ms ease-in-out;
}

/* Ensure text doesn't overflow */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.break-all {
  word-break: break-all;
}

/* Animation utilities */
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

.animate-in {
  animation:
    fade-in 0.2s ease-out,
    slide-in-from-top 0.2s ease-out;
}
</style>
