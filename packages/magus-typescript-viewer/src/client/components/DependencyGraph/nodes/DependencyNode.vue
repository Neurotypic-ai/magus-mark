<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
import { computed } from 'vue';

import type { DependencyProps } from '../types';

const props = defineProps<DependencyProps>();

// Make sure data exists and has the required properties
const nodeData = computed(() => props.data);
const nodeType = computed(() => props.type);
const isSelected = computed(() => !!props.selected);

// Compute visibility color
const getVisibilityColor = (visibility: string) => {
  if (visibility === 'public') return 'bg-visibility-public';
  if (visibility === 'protected') return 'bg-visibility-protected';
  return 'bg-visibility-private';
};

const containerClasses = computed(() => {
  const baseClasses = [
    'relative',
    'rounded',
    'border',
    'transition-fast',
    'cursor-move',
    'w-auto',
    'h-auto',
    'shadow-lg',
  ];

  const sizeClasses = nodeType.value === 'package' ? ['text-sm', 'p-3'] : ['text-xs', 'p-2'];

  const bgClass = nodeType.value === 'package' ? 'bg-background-node-package' : 'bg-background-node';

  const borderClass = isSelected.value
    ? 'border-border-focus shadow-[0_0_12px_rgba(144,202,249,0.4)]'
    : 'border-border-default hover:border-border-hover';

  const zIndexClass = nodeType.value === 'package' ? 'z-[5]' : 'z-[1]';

  return [...baseClasses, ...sizeClasses, bgClass, borderClass, zIndexClass].join(' ');
});
</script>

<template>
  <div :class="containerClasses">
    <Handle type="target" :position="Position.Top" />

    <!-- Node Header -->
    <div class="flex items-center gap-1 border-b border-border-default pb-1 mb-1">
      <div
        :class="[
          'flex-1 font-medium text-text-primary overflow-hidden text-ellipsis whitespace-nowrap',
          nodeType === 'package' ? 'text-sm' : 'text-xs',
        ]"
      >
        {{ nodeData.label || 'Unnamed' }}
      </div>
      <div class="px-2 py-0.5 bg-white/10 rounded text-text-secondary text-xs uppercase tracking-wider font-semibold">
        {{ nodeType }}
      </div>
    </div>

    <!-- Node Content -->
    <div class="flex flex-col gap-1 max-h-[120px] overflow-y-auto">
      <!-- Properties Section -->
      <div
        v-if="nodeData.properties && nodeData.properties.length > 0"
        class="flex flex-col gap-0.5 p-1.5 bg-white/5 rounded"
      >
        <div class="text-text-secondary text-xs font-bold uppercase mb-0.5">Properties</div>
        <div
          v-for="(prop, index) in nodeData.properties"
          :key="index"
          class="flex items-center gap-1.5 text-text-primary text-xs p-0.5 rounded transition-fast hover:bg-white/10"
        >
          <span
            v-if="prop.visibility"
            :class="['w-2 h-2 rounded-full flex-shrink-0', getVisibilityColor(prop.visibility)]"
          ></span>
          <span class="truncate">{{ prop.name }}: {{ prop.type }}</span>
        </div>
      </div>

      <!-- Methods Section -->
      <div
        v-if="nodeData.methods && nodeData.methods.length > 0"
        class="flex flex-col gap-0.5 p-1.5 bg-white/5 rounded"
      >
        <div class="text-text-secondary text-xs font-bold uppercase mb-0.5">Methods</div>
        <div
          v-for="(method, index) in nodeData.methods"
          :key="index"
          class="flex items-center gap-1.5 text-text-primary text-xs p-0.5 rounded transition-fast hover:bg-white/10"
        >
          <span
            v-if="method.visibility"
            :class="['w-2 h-2 rounded-full flex-shrink-0', getVisibilityColor(method.visibility)]"
          ></span>
          <span class="truncate">{{ method.name }}(): {{ method.returnType }}</span>
        </div>
      </div>
    </div>

    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>
