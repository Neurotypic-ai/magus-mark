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
</script>

<template>
  <div :class="['node-container', { 'node-selected': isSelected }]">
    <Handle type="target" :position="targetPosition" class="node-handle" />

    <!-- Node Header -->
    <div class="node-header">
      <div class="node-title-container">
        <div class="node-title" :title="nodeData.label">
          {{ nodeData.label || 'Unnamed Module' }}
        </div>
      </div>
      <div class="node-badge">MODULE</div>
    </div>

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

    <!-- Empty State -->
    <div v-else class="empty-state">No metadata available</div>

    <Handle type="source" :position="sourcePosition" class="node-handle" />
  </div>
</template>

<style scoped>
/* Node Container */
.node-container {
  position: relative;
  border-radius: 0.25rem;
  border: 1px solid var(--border-default);
  transition: all 200ms;
  cursor: move;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  font-size: 0.75rem;
  line-height: 1rem;
  z-index: 1;
  min-width: 280px;
  max-width: 400px;
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

/* Node Handles */
.node-handle {
  width: 0.75rem !important;
  height: 0.75rem !important;
}

/* Node Header */
.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border-default);
  padding: 0.5rem 0.75rem;
}

.node-title-container {
  flex: 1;
  min-width: 0;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}

.node-title {
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  flex-shrink: 0;
}

/* Metadata Section */
.metadata-section {
  border-bottom: 1px solid rgba(var(--border-default-rgb), 0.5);
}

.metadata-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  transition: background-color 200ms;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
}

.metadata-toggle:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.metadata-label {
  color: var(--text-secondary);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.metadata-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: var(--text-secondary);
  transition: transform 200ms;
}

.metadata-icon-expanded {
  transform: rotate(180deg);
}

.metadata-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0 1rem 0.75rem 1rem;
  animation:
    fade-in 200ms ease-out,
    slide-in-from-top 200ms ease-out;
}

.metadata-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 200ms;
}

.metadata-prop-name {
  font-weight: 600;
  color: var(--text-secondary);
  flex-shrink: 0;
  min-width: 50px;
}

.metadata-prop-value {
  color: var(--text-primary);
  word-break: break-all;
}

/* Empty State */
.empty-state {
  padding: 1rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.75rem;
  line-height: 1rem;
  font-style: italic;
  opacity: 0.6;
}

/* Animations */
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
