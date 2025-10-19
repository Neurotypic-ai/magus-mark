<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
import { computed } from 'vue';

import type { DependencyProps } from '../types';

const props = defineProps<DependencyProps>();

const nodeData = computed(() => props.data);
const isSelected = computed(() => !!props.selected);

// Get handle positions from props (set by createGraphNodes based on layout direction)
const sourcePosition = computed(() => props.sourcePosition ?? Position.Bottom);
const targetPosition = computed(() => props.targetPosition ?? Position.Top);
</script>

<template>
  <div :class="['package-container', { 'package-selected': isSelected }]">
    <Handle type="target" :position="targetPosition" class="package-handle" />

    <!-- Node Header -->
    <div class="package-header">
      <div class="package-title">
        {{ nodeData.label || 'Unnamed Package' }}
      </div>
      <div class="package-badge">PACKAGE</div>
    </div>

    <!-- Package Metadata -->
    <div v-if="nodeData.properties && nodeData.properties.length > 0" class="package-metadata">
      <div v-for="(prop, index) in nodeData.properties" :key="index" class="metadata-item">
        <span class="metadata-name">{{ prop.name }}:</span>
        <span class="metadata-value">{{ prop.type }}</span>
      </div>
    </div>

    <Handle type="source" :position="sourcePosition" class="package-handle" />
  </div>
</template>

<style scoped>
/* Package Container */
.package-container {
  position: relative;
  border-radius: 0.5rem;
  border: 2px solid var(--border-default);
  transition: all 150ms ease-in-out;
  cursor: move;
  width: auto;
  height: auto;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  font-size: 0.875rem;
  line-height: 1.25rem;
  padding: 0.75rem;
  background-color: var(--background-node-package);
  z-index: 0;
}

.package-container:hover {
  border-color: var(--border-hover);
}

.package-container.package-selected {
  border-color: var(--border-focus);
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 12px rgba(144, 202, 249, 0.4);
}

/* Package Handles */
.package-handle {
  width: 0.75rem;
  height: 0.75rem;
}

/* Package Header */
.package-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border-default);
  padding: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.package-title {
  flex: 1;
  font-weight: 700;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}

.package-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.75rem;
  line-height: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

/* Package Metadata */
.package-metadata {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.75rem;
  line-height: 1rem;
}

.metadata-name {
  font-weight: 600;
}

.metadata-value {
  color: var(--text-secondary);
}
</style>
