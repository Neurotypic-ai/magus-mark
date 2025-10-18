<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
import { computed } from 'vue';

import type { DependencyProps } from '../types';

const props = defineProps<DependencyProps>();

const nodeData = computed(() => props.data);
const isSelected = computed(() => !!props.selected);

const containerClasses = computed(() => {
  const baseClasses = [
    'relative',
    'rounded-lg',
    'border-2',
    'transition-fast',
    'cursor-move',
    'w-auto',
    'h-auto',
    'shadow-xl',
    'text-sm',
    'p-3',
    'bg-background-node-package',
    'z-[0]',
  ];

  const borderClass = isSelected.value
    ? 'border-border-focus shadow-[0_0_12px_rgba(144,202,249,0.4)]'
    : 'border-border-default hover:border-border-hover';

  return [...baseClasses, borderClass].join(' ');
});
</script>

<template>
  <div :class="containerClasses">
    <Handle type="target" :position="Position.Top" />

    <!-- Node Header -->
    <div class="flex items-center gap-2 border-b border-border-default pb-2 mb-2">
      <div class="flex-1 font-bold text-text-primary overflow-hidden text-ellipsis whitespace-nowrap">
        {{ nodeData.label || 'Unnamed Package' }}
      </div>
      <div class="px-2 py-0.5 bg-white/10 rounded text-text-secondary text-xs uppercase tracking-wider font-semibold">
        PACKAGE
      </div>
    </div>

    <!-- Package Metadata -->
    <div v-if="nodeData.properties && nodeData.properties.length > 0" class="flex flex-col gap-0.5">
      <div
        v-for="(prop, index) in nodeData.properties"
        :key="index"
        class="flex items-center gap-1.5 text-text-secondary text-xs"
      >
        <span class="font-semibold">{{ prop.name }}:</span>
        <span>{{ prop.type }}</span>
      </div>
    </div>

    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>
