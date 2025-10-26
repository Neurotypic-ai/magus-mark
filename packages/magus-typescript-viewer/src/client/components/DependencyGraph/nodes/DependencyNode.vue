<script setup lang="ts">
import { computed } from 'vue';

import BaseNode from './BaseNode.vue';

import type { DependencyProps } from '../types';

const props = defineProps<DependencyProps>();

// Make sure data exists and has the required properties
const nodeData = computed(() => props.data);
const nodeType = computed(() => props.type);

// Compute visibility color class
const getVisibilityColor = (visibility: string) => {
  if (visibility === 'public') return 'visibility-public';
  if (visibility === 'protected') return 'visibility-protected';
  return 'visibility-private';
};

// Compute z-index based on node type
const nodeZIndex = computed(() => {
  switch (nodeType.value) {
    case 'package':
      return 5;
    case 'module':
      return 4;
    case 'class':
    case 'interface':
      return 3;
    default:
      return 1;
  }
});

// Badge text is the node type uppercased
const badgeText = computed(() => String(nodeType.value).toUpperCase());
</script>

<template>
  <BaseNode v-bind="props" :badge-text="badgeText" :z-index="nodeZIndex">
    <template #content>
      <!-- Node Content -->
      <div class="node-content">
        <!-- Properties Section -->
        <div v-if="nodeData.properties && nodeData.properties.length > 0" class="section">
          <div class="section-header">Properties</div>
          <div v-for="(prop, index) in nodeData.properties" :key="index" class="section-item">
            <span v-if="prop.visibility" :class="['visibility-indicator', getVisibilityColor(prop.visibility)]"></span>
            <span class="section-item-text">{{ prop.name }}: {{ prop.type }}</span>
          </div>
        </div>

        <!-- Methods Section -->
        <div v-if="nodeData.methods && nodeData.methods.length > 0" class="section">
          <div class="section-header">Methods</div>
          <div v-for="(method, index) in nodeData.methods" :key="index" class="section-item">
            <span
              v-if="method.visibility"
              :class="['visibility-indicator', getVisibilityColor(method.visibility)]"
            ></span>
            <span class="section-item-text">{{ method.name }}(): {{ method.returnType }}</span>
          </div>
        </div>
      </div>
    </template>
  </BaseNode>
</template>

<style scoped>
@import 'tailwindcss';

/* Node Content */
.node-content {
  @apply flex flex-col gap-2 p-3;
}

/* Section */
.section {
  @apply flex flex-col gap-1;
}

.section-header {
  @apply text-xs leading-4 font-bold uppercase;
  color: var(--text-secondary);
}

.section-item {
  @apply flex items-center gap-1.5 px-1 py-0.5 rounded transition-all duration-150;
  @apply text-xs leading-4;
  color: var(--text-primary);
}

.section-item-text {
  @apply overflow-hidden text-ellipsis whitespace-nowrap;
}

/* Visibility Indicators */
.visibility-indicator {
  @apply w-2 h-2 rounded-full shrink-0;
}

.visibility-public {
  background-color: var(--visibility-public);
}

.visibility-protected {
  background-color: var(--visibility-protected);
}

.visibility-private {
  background-color: var(--visibility-private);
}
</style>
