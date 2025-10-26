<script setup lang="ts">
import { computed } from 'vue';

import BaseNode from './BaseNode.vue';

import type { DependencyProps } from '../types';

const props = defineProps<DependencyProps>();

const nodeData = computed(() => props.data);
</script>

<template>
  <BaseNode v-bind="props" badge-text="PACKAGE" :z-index="0" badge-class="package-badge">
    <template #content>
      <!-- Package Metadata -->
      <div v-if="nodeData.properties && nodeData.properties.length > 0" class="package-metadata">
        <div v-for="(prop, index) in nodeData.properties" :key="index" class="metadata-item">
          <span class="metadata-name">{{ prop.name }}:</span>
          <span class="metadata-value">{{ prop.type }}</span>
        </div>
      </div>
    </template>
  </BaseNode>
</template>

<style scoped>
@import 'tailwindcss' reference;

/* Package-specific badge styling */
.package-badge {
  background-color: var(--background-node-package);
}

/* Package Metadata */
.package-metadata {
  @apply flex flex-col gap-1 px-4 py-3;
}

.metadata-item {
  @apply flex items-center gap-2 text-xs leading-4;
  color: var(--text-secondary);
}

.metadata-name {
  @apply font-semibold;
}

.metadata-value {
  color: var(--text-secondary);
}
</style>
