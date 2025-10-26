<script setup lang="ts">
import { useVueFlow } from '@vue-flow/core';
import { computed, nextTick, onMounted, ref } from 'vue';

import BaseNode from './BaseNode.vue';

import type { DependencyProps } from '../types';

const props = defineProps<DependencyProps>();

const nodeData = computed(() => props.data);

// Ask VueFlow to recompute node dimensions when content changes
const { updateNodeInternals } = useVueFlow();

onMounted(async () => {
  await nextTick();
  updateNodeInternals([props.id]);
  // Also trigger parent update if this is a child node
  if (props.data?.parentId) {
    updateNodeInternals([props.data.parentId]);
  }
});

// Collapsible sections state
const isMetadataExpanded = ref(true);

const toggleMetadata = async () => {
  isMetadataExpanded.value = !isMetadataExpanded.value;
  await nextTick();
  updateNodeInternals([props.id]);
  // Trigger parent resize
  if (props.data?.parentId) {
    updateNodeInternals([props.data.parentId]);
  }
};
</script>

<template>
  <BaseNode v-bind="props" badge-text="MODULE">
    <template #content>
      <!-- Module Metadata Section -->
      <div v-if="nodeData.properties && nodeData.properties.length > 0" class="metadata-section">
        <!-- Collapsible Header -->
        <button
          class="metadata-toggle"
          @click="toggleMetadata"
          type="button"
          :aria-expanded="isMetadataExpanded"
          aria-label="Toggle metadata section"
        >
          <span class="metadata-label">Metadata</span>
          <svg
            class="metadata-icon"
            :class="{ 'metadata-icon-expanded': isMetadataExpanded }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Collapsible Content -->
        <div v-show="isMetadataExpanded" class="metadata-content">
          <div v-for="(prop, index) in nodeData.properties" :key="index" class="metadata-item">
            <span class="metadata-prop-name">{{ prop.name }}:</span>
            <span class="metadata-prop-value" :title="prop.type">{{ prop.type }}</span>
          </div>
        </div>
      </div>
    </template>

    <template #empty>
      <!-- Empty State -->
      <div v-if="!nodeData.properties || nodeData.properties.length === 0" class="empty-state">
        No metadata available
      </div>
    </template>
  </BaseNode>
</template>

<style scoped>
@import 'tailwindcss' reference;

/* Metadata Section */
.metadata-section {
  @apply border-b;
  border-color: rgba(var(--border-default-rgb), 0.5);
}

.metadata-toggle {
  @apply w-full flex items-center justify-between px-3 py-2 transition-colors duration-200;
  @apply text-left bg-transparent border-none cursor-pointer;
}

.metadata-toggle:hover {
  @apply bg-white/5;
}

.metadata-label {
  @apply text-[0.625rem] font-bold uppercase tracking-wide;
  color: var(--text-secondary);
}

.metadata-icon {
  @apply w-3 h-3 transition-transform duration-200;
  color: var(--text-secondary);
}

.metadata-icon-expanded {
  @apply rotate-180;
}

.metadata-content {
  @apply flex flex-col gap-1 px-4 pb-3 max-h-[200px] overflow-y-auto;
  animation:
    fade-in 200ms ease-out,
    slide-in-from-top 200ms ease-out;
}

/* Custom Scrollbar for metadata */
.metadata-content::-webkit-scrollbar {
  @apply w-1.5;
}

.metadata-content::-webkit-scrollbar-track {
  @apply bg-white/5 rounded;
}

.metadata-content::-webkit-scrollbar-thumb {
  @apply bg-white/20 rounded;
}

.metadata-content::-webkit-scrollbar-thumb:hover {
  @apply bg-white/30;
}

.metadata-item {
  @apply flex items-start gap-2 text-xs leading-4 p-2 rounded transition-colors duration-200;
}

.metadata-prop-name {
  @apply font-semibold shrink-0 min-w-[50px];
  color: var(--text-secondary);
}

.metadata-prop-value {
  @apply break-all;
  color: var(--text-primary);
}

/* Empty State */
.empty-state {
  @apply p-4 text-center text-xs leading-4 italic opacity-60;
  color: var(--text-secondary);
}
</style>
