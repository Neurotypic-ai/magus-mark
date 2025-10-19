<script setup lang="ts">
import { Panel, useVueFlow } from '@vue-flow/core';
import { computed, ref } from 'vue';

import { useGraphSettings } from '../../../stores/graphSettings';

import type { DependencyKind } from '../types';

const emit = defineEmits<{
  'relationship-filter-change': [types: string[]];
  'reset-layout': [];
  'layout-change': [config: { direction?: string; nodeSpacing?: number; rankSpacing?: number }];
  'toggle-cluster-folder': [value: boolean];
  'toggle-show-packages': [value: boolean];
  'toggle-show-classes': [value: boolean];
  'node-visibility-change': [];
}>();

const { zoomIn, zoomOut, fitView } = useVueFlow();
const graphSettings = useGraphSettings();

// Layout configuration - use writable computed properties for two-way binding
const layoutDirection = computed(() => graphSettings.layoutDirection);
const nodeSpacing = computed({
  get: () => graphSettings.nodeSpacing,
  set: (value: number) => graphSettings.setNodeSpacing(value),
});
const rankSpacing = computed({
  get: () => graphSettings.rankSpacing,
  set: (value: number) => graphSettings.setRankSpacing(value),
});

// View options - use computed to reference the store's reactive refs
const showPackages = computed(() => graphSettings.showPackages);
const showClasses = computed(() => graphSettings.showClasses);
const clusterByFolder = computed(() => graphSettings.clusterByFolder);

// Relationship filters - use computed to reference the store's reactive refs
const enabledTypes = computed(() => graphSettings.enabledRelationshipTypes);

const handleZoomIn = () => {
  void zoomIn({ duration: 150 });
};

const handleZoomOut = () => {
  void zoomOut({ duration: 150 });
};

const handleFitView = () => {
  void fitView({ duration: 150, padding: 0.1 });
};

const handleResetLayout = () => {
  emit('reset-layout');
};

// Node types that can be toggled
// Note: Only include leaf/content node types, not containers (package, module, group)
// Packages and modules are controlled by includePackages/includeClasses options
const nodeTypes: DependencyKind[] = ['class', 'interface', 'enum', 'type', 'function'];

const nodeTypeLabels: Record<DependencyKind, string> = {
  package: 'Packages',
  module: 'Modules',
  class: 'Classes',
  interface: 'Interfaces',
  enum: 'Enums',
  type: 'Types',
  function: 'Functions',
  group: 'Groups',
  property: 'Properties',
  method: 'Methods',
};

const handleNodeTypeToggle = (nodeType: DependencyKind) => {
  graphSettings.toggleNodeType(nodeType);
  emit('node-visibility-change');
};

const isNodeTypeVisible = (nodeType: DependencyKind) => {
  return graphSettings.isNodeTypeVisible(nodeType);
};

// Relationship types matching the actual edge data types (lowercase)
const relationshipTypes = [
  'import',
  'export',
  'inheritance',
  'implements',
  'contains',
  'dependency',
  'devDependency',
  'peerDependency',
];

const handleFilterChange = (type: string, checked: boolean) => {
  const currentTypes = enabledTypes.value;
  const newTypes = checked ? [...currentTypes, type] : currentTypes.filter((t) => t !== type);
  graphSettings.setEnabledRelationshipTypes(newTypes);
  emit('relationship-filter-change', newTypes);
};

const handleDirectionChange = (direction: 'LR' | 'RL' | 'TB' | 'BT') => {
  graphSettings.setLayoutDirection(direction);
  emit('layout-change', { direction });
};

const handleSpacingChange = () => {
  // Values are already updated via writable computed setters
  emit('layout-change', {
    nodeSpacing: nodeSpacing.value,
    rankSpacing: rankSpacing.value,
  });
};

const handleShowPackagesToggle = (checked: boolean) => {
  graphSettings.setShowPackages(checked);
  emit('toggle-show-packages', checked);
};

const handleShowClassesToggle = (checked: boolean) => {
  graphSettings.setShowClasses(checked);
  emit('toggle-show-classes', checked);
};

const handleClusterByFolderToggle = (checked: boolean) => {
  graphSettings.setClusterByFolder(checked);
  emit('toggle-cluster-folder', checked);
};
</script>

<template>
  <Panel position="top-left">
    <div class="bg-background-paper p-4 rounded-lg border border-border-default shadow-xl">
      <!-- Button Group -->
      <div class="flex gap-2 mb-4">
        <button
          @click="handleZoomIn"
          class="px-3 py-1.5 bg-white/10 text-text-primary rounded hover:bg-white/20 transition-fast border border-border-default font-semibold"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          @click="handleZoomOut"
          class="px-3 py-1.5 bg-white/10 text-text-primary rounded hover:bg-white/20 transition-fast border border-border-default font-semibold"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          @click="handleFitView"
          class="px-3 py-1.5 bg-white/10 text-text-primary rounded hover:bg-white/20 transition-fast border border-border-default text-xs font-semibold"
          aria-label="Fit view to content"
        >
          Fit
        </button>
        <button
          @click="handleResetLayout"
          class="px-3 py-1.5 bg-white/10 text-text-primary rounded hover:bg-white/20 transition-fast border border-border-default text-xs font-semibold"
          aria-label="Reset layout"
        >
          Reset
        </button>
      </div>

      <!-- Layout Direction (dagre uses hierarchical layout with different flow directions) -->
      <div class="mt-4 pt-4 border-t border-border-default">
        <h4 class="text-sm font-semibold text-text-primary mb-2">Layout Direction</h4>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="dir in ['LR', 'RL', 'TB', 'BT']"
            :key="dir"
            @click="handleDirectionChange(dir as 'LR' | 'RL' | 'TB' | 'BT')"
            :class="[
              'px-2 py-1.5 text-xs rounded border transition-fast',
              layoutDirection === dir
                ? 'bg-primary-main text-white border-primary-main'
                : 'bg-white/10 text-text-primary border-border-default hover:bg-white/20',
            ]"
            :aria-label="`Set layout direction to ${dir}`"
          >
            {{ dir }}
          </button>
        </div>
      </div>

      <!-- Spacing Controls -->
      <div class="mt-4 pt-4 border-t border-border-default">
        <h4 class="text-sm font-semibold text-text-primary mb-2">Spacing</h4>
        <div class="flex flex-col gap-3">
          <div>
            <label class="text-xs text-text-secondary block mb-1"> Node Spacing: {{ nodeSpacing }} </label>
            <input
              v-model.number="nodeSpacing"
              type="range"
              min="50"
              max="200"
              step="10"
              @change="handleSpacingChange"
              class="w-full cursor-pointer accent-primary-main"
            />
          </div>
          <div>
            <label class="text-xs text-text-secondary block mb-1"> Rank Spacing: {{ rankSpacing }} </label>
            <input
              v-model.number="rankSpacing"
              type="range"
              min="100"
              max="300"
              step="10"
              @change="handleSpacingChange"
              class="w-full cursor-pointer accent-primary-main"
            />
          </div>
        </div>
      </div>

      <!-- View Options -->
      <div class="mt-4 pt-4 border-t border-border-default">
        <h4 class="text-sm font-semibold text-text-primary mb-2">View Options</h4>
        <div class="flex flex-col gap-2">
          <label
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="showPackages"
              @change="(e) => handleShowPackagesToggle((e.target as HTMLInputElement).checked)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs">Show package nodes</span>
          </label>
          <label
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="showClasses"
              @change="(e) => handleShowClassesToggle((e.target as HTMLInputElement).checked)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs">Show class details</span>
          </label>
          <label
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="clusterByFolder"
              @change="(e) => handleClusterByFolderToggle((e.target as HTMLInputElement).checked)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs">Group by folder</span>
          </label>
        </div>
      </div>

      <!-- Symbol Type Filters (only shown when class details are visible) -->
      <div v-if="showClasses" class="mt-4 pt-4 border-t border-border-default">
        <h4 class="text-sm font-semibold text-text-primary mb-2">Symbol Types</h4>
        <div class="flex flex-col gap-1.5">
          <label
            v-for="nodeType in nodeTypes"
            :key="nodeType"
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="isNodeTypeVisible(nodeType)"
              @change="handleNodeTypeToggle(nodeType)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs capitalize">{{ nodeTypeLabels[nodeType] }}</span>
          </label>
        </div>
      </div>

      <!-- Filter Panel -->
      <div class="mt-4 pt-4 border-t border-border-default">
        <h4 class="text-sm font-semibold text-text-primary mb-2">Relationship Types</h4>
        <div class="flex flex-col gap-1.5">
          <label
            v-for="type in relationshipTypes"
            :key="type"
            class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-fast"
          >
            <input
              type="checkbox"
              :checked="enabledTypes.includes(type)"
              @change="(e) => handleFilterChange(type, (e.target as HTMLInputElement).checked)"
              class="cursor-pointer accent-primary-main"
            />
            <span class="text-xs capitalize">{{ type }}</span>
          </label>
        </div>
      </div>
    </div>
  </Panel>
</template>
