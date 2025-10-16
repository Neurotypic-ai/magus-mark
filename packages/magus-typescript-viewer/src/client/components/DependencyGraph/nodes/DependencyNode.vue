<script setup lang="ts">
import { computed } from 'vue';

import { Handle, Position } from '@vue-flow/core';

import type { DependencyProps } from '../types';

const props = defineProps<DependencyProps>();

// Make sure data exists and has the required properties
const nodeData = computed(() => props.data);
const nodeType = computed(() => props.type);
const isSelected = computed(() => !!props.selected);

// Safe debug logging with type checks
console.info('DependencyNode data:', {
  id: props.id,
  type: nodeType.value,
  properties: nodeData.value.properties ?? [],
  methods: nodeData.value.methods ?? [],
});

// Compute visibility color
const getVisibilityColor = (visibility: string) => {
  if (visibility === 'public') return 'bg-green-500';
  if (visibility === 'protected') return 'bg-yellow-500';
  return 'bg-red-500';
};

const containerClasses = computed(() => {
  const baseClasses = [
    'relative',
    'rounded',
    'border',
    'transition-all',
    'duration-200',
    'cursor-move',
    'w-auto',
    'h-auto',
  ];

  const sizeClasses = nodeType.value === 'package' ? ['text-sm', 'p-3'] : ['text-xs', 'p-2'];

  const styleClasses = [
    'bg-background-default',
    isSelected.value ? 'border-blue-500 shadow-[0_0_0_1px_rgba(144,202,249,0.5)]' : 'border-gray-600',
  ];

  const zIndexClass = nodeType.value === 'package' ? 'z-[5]' : 'z-[1]';

  return [...baseClasses, ...sizeClasses, ...styleClasses, zIndexClass].join(' ');
});
</script>

<template>
  <div :class="containerClasses">
    <Handle type="target" :position="Position.Top" />
    
    <!-- Node Header -->
    <div class="flex items-center gap-1 border-b border-gray-600 pb-1 mb-1">
      <div
        :class="['flex-1 font-medium text-white overflow-hidden text-ellipsis whitespace-nowrap', nodeType === 'package' ? 'text-sm' : 'text-xs']"
      >
        {{ nodeData.label || 'Unnamed' }}
      </div>
      <div class="px-2 py-1 bg-white bg-opacity-10 rounded text-gray-400 text-xs uppercase tracking-wider">
        {{ nodeType }}
      </div>
    </div>

    <!-- Node Content -->
    <div class="flex flex-col gap-1 max-h-[120px] overflow-y-auto">
      <!-- Properties Section -->
      <div v-if="nodeData.properties && nodeData.properties.length > 0" class="flex flex-col gap-0.5 p-1 bg-white bg-opacity-5 rounded">
        <div class="text-gray-400 text-xs font-bold uppercase mb-0.5">Properties</div>
        <div
          v-for="(prop, index) in nodeData.properties"
          :key="index"
          class="flex items-center gap-1 text-white text-xs p-0.5 rounded hover:bg-white hover:bg-opacity-10"
        >
          <span
            v-if="prop.visibility"
            :class="['w-2 h-2 rounded-full', getVisibilityColor(prop.visibility)]"
          ></span>
          <span>{{ prop.name }}: {{ prop.type }}</span>
        </div>
      </div>

      <!-- Methods Section -->
      <div v-if="nodeData.methods && nodeData.methods.length > 0" class="flex flex-col gap-0.5 p-1 bg-white bg-opacity-5 rounded">
        <div class="text-gray-400 text-xs font-bold uppercase mb-0.5">Methods</div>
        <div
          v-for="(method, index) in nodeData.methods"
          :key="index"
          class="flex items-center gap-1 text-white text-xs p-0.5 rounded hover:bg-white hover:bg-opacity-10"
        >
          <span
            v-if="method.visibility"
            :class="['w-2 h-2 rounded-full', getVisibilityColor(method.visibility)]"
          ></span>
          <span>{{ method.name }}(): {{ method.returnType }}</span>
        </div>
      </div>
    </div>

    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>
