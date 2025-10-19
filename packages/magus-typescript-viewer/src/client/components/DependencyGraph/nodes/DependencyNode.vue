<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
import { computed } from 'vue';

import type { DependencyProps } from '../types';

const props = defineProps<DependencyProps>();

// Make sure data exists and has the required properties
const nodeData = computed(() => props.data);
const nodeType = computed(() => props.type);
const isSelected = computed(() => !!props.selected);

// Get handle positions from props (set by createGraphNodes based on layout direction)
const sourcePosition = computed(() => props.sourcePosition ?? Position.Bottom);
const targetPosition = computed(() => props.targetPosition ?? Position.Top);

// Compute visibility color class
const getVisibilityColor = (visibility: string) => {
  if (visibility === 'public') return 'visibility-public';
  if (visibility === 'protected') return 'visibility-protected';
  return 'visibility-private';
};
</script>

<template>
  <div :class="['node-container', `node-type-${nodeType}`, { 'node-selected': isSelected }]">
    <Handle type="target" :position="targetPosition" class="node-handle" />

    <!-- Node Header -->
    <div class="node-header">
      <div :class="['node-title', nodeType === 'package' ? 'node-title-large' : '']">
        {{ nodeData.label || 'Unnamed' }}
      </div>
      <div class="node-badge">
        {{ nodeType }}
      </div>
    </div>

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

    <Handle type="source" :position="sourcePosition" class="node-handle" />
  </div>
</template>

<style scoped>
/* Node Container Base */
.node-container {
  position: relative;
  border-radius: 0.25rem;
  border: 1px solid var(--border-default);
  transition: all 150ms ease-in-out;
  cursor: move;
  width: auto;
  height: auto;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.node-container:hover {
  border-color: var(--border-hover);
}

.node-container.node-selected {
  border-color: var(--border-focus);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05),
    0 0 12px rgba(144, 202, 249, 0.4);
}

/* Type-specific Styling */
.node-type-package {
  font-size: 0.875rem;
  line-height: 1.25rem;
  padding: 0.75rem;
  background-color: var(--background-node-package);
  z-index: 5;
}

.node-type-module {
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.5rem;
  background-color: var(--background-node);
  z-index: 4;
}

.node-type-class,
.node-type-interface {
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.5rem;
  background-color: var(--background-node);
  z-index: 3;
}

.node-container:not(.node-type-package):not(.node-type-module):not(.node-type-class):not(.node-type-interface) {
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.5rem;
  background-color: var(--background-node);
  z-index: 1;
}

/* Node Handles */
.node-handle {
  width: 0.75rem;
  height: 0.75rem;
}

/* Node Header */
.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border-default);
  padding: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.node-title {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  font-size: 0.75rem;
  line-height: 1rem;
}

.node-title-large {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.node-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.75rem;
  line-height: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

/* Node Content */
.node-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
}

/* Section */
.section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.section-header {
  color: var(--text-secondary);
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 700;
  text-transform: uppercase;
}

.section-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--text-primary);
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  transition: all 150ms ease-in-out;
}

.section-item-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Visibility Indicators */
.visibility-indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  flex-shrink: 0;
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
