<script setup lang="ts">
import { Panel, useVueFlow } from '@vue-flow/core';

const emit = defineEmits<{
  'relationship-filter-change': [types: string[]];
  'reset-layout': [];
}>();

const { zoomIn, zoomOut, fitView } = useVueFlow();

const handleZoomIn = () => {
  void zoomIn({ duration: 300 });
};

const handleZoomOut = () => {
  void zoomOut({ duration: 300 });
};

const handleFitView = () => {
  void fitView({ duration: 300 });
};

const handleResetLayout = () => {
  emit('reset-layout');
};

const relationshipTypes = ['IMPORTS', 'EXPORTS', 'EXTENDS', 'IMPLEMENTS', 'CONTAINS', 'USES', 'REFERENCES'];

const handleFilterChange = (type: string, checked: boolean) => {
  const types = checked ? [...relationshipTypes] : relationshipTypes.filter((t) => t !== type);
  emit('relationship-filter-change', types);
};
</script>

<template>
  <Panel position="top-left">
    <div class="bg-background-paper p-4 rounded-lg border border-gray-700 shadow-lg">
      <!-- Button Group -->
      <div class="flex gap-2 mb-4">
        <button
          @click="handleZoomIn"
          class="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors border border-gray-600"
        >
          +
        </button>
        <button
          @click="handleZoomOut"
          class="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors border border-gray-600"
        >
          -
        </button>
        <button
          @click="handleFitView"
          class="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors border border-gray-600"
        >
          Fit
        </button>
        <button
          @click="handleResetLayout"
          class="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors border border-gray-600"
        >
          Reset Layout
        </button>
      </div>

      <!-- Filter Panel -->
      <div class="mt-4">
        <h4 class="text-sm font-semibold text-gray-300 mb-2">Relationship Types</h4>
        <div class="flex flex-col gap-1">
          <label
            v-for="type in relationshipTypes"
            :key="type"
            class="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-200 transition-colors"
          >
            <input
              type="checkbox"
              :checked="true"
              @change="(e) => handleFilterChange(type, (e.target as HTMLInputElement).checked)"
              class="cursor-pointer"
            />
            {{ type }}
          </label>
        </div>
      </div>
    </div>
  </Panel>
</template>
