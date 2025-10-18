<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
import { computed, ref } from 'vue';

import type { DependencyProps } from '../types';

const props = defineProps<DependencyProps>();

const nodeData = computed(() => props.data);
const nodeType = computed(() => props.type);
const isSelected = computed(() => !!props.selected);

// Collapsible sections state
const isPropertiesExpanded = ref(true);
const isMethodsExpanded = ref(true);

const toggleProperties = () => {
  isPropertiesExpanded.value = !isPropertiesExpanded.value;
};

const toggleMethods = () => {
  isMethodsExpanded.value = !isMethodsExpanded.value;
};

// Compute visibility color and icon
const getVisibilityColor = (visibility: string) => {
  if (visibility === 'public') return 'bg-green-500';
  if (visibility === 'protected') return 'bg-yellow-500';
  return 'bg-red-500';
};

const getVisibilitySymbol = (visibility: string) => {
  if (visibility === 'public') return '+';
  if (visibility === 'protected') return '#';
  return '-';
};

const containerClasses = computed(() => {
  const baseClasses = [
    'relative',
    'rounded',
    'border',
    'transition-all',
    'duration-200',
    'cursor-move',
    'shadow-lg',
    'text-xs',
    'bg-background-node',
    'z-[2]',
    'min-w-[280px]',
    'max-w-[450px]',
  ];

  const borderClass = isSelected.value
    ? 'border-border-focus shadow-[0_0_16px_rgba(144,202,249,0.5)]'
    : 'border-border-default hover:border-border-hover';

  return [...baseClasses, borderClass].join(' ');
});

// Get type-specific styling
const getTypeColor = computed(() => {
  switch (nodeType.value) {
    case 'class':
      return 'bg-blue-500/20 text-blue-300';
    case 'interface':
      return 'bg-purple-500/20 text-purple-300';
    case 'enum':
      return 'bg-orange-500/20 text-orange-300';
    case 'type':
      return 'bg-teal-500/20 text-teal-300';
    default:
      return 'bg-white/10 text-text-secondary';
  }
});

const hasContent = computed(() => {
  const hasProps = nodeData.value.properties && nodeData.value.properties.length > 0;
  const hasMethods = nodeData.value.methods && nodeData.value.methods.length > 0;
  return hasProps || hasMethods;
});
</script>

<template>
  <div :class="containerClasses">
    <Handle type="target" :position="Position.Top" class="!w-3 !h-3" />

    <!-- Node Header -->
    <div class="flex items-center gap-2 border-b border-border-default p-3 bg-white/5">
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-sm text-text-primary truncate" :title="nodeData.label">
          {{ nodeData.label || 'Unnamed' }}
        </div>
      </div>
      <div :class="['px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold flex-shrink-0', getTypeColor]">
        {{ nodeType }}
      </div>
    </div>

    <!-- Node Content -->
    <div v-if="hasContent" class="flex flex-col">
      <!-- Properties Section -->
      <div v-if="nodeData.properties && nodeData.properties.length > 0" class="border-b border-border-default/50">
        <!-- Collapsible Header -->
        <button
          class="w-full flex items-center justify-between p-2 px-3 hover:bg-white/5 transition-colors text-left"
          @click="toggleProperties"
          type="button"
          :aria-expanded="isPropertiesExpanded"
          aria-label="Toggle properties section"
        >
          <div class="flex items-center gap-2">
            <span class="text-text-secondary text-[10px] font-bold uppercase tracking-wide">Properties</span>
            <span class="text-text-secondary/60 text-[10px]">({{ nodeData.properties.length }})</span>
          </div>
          <svg
            class="w-3 h-3 text-text-secondary transition-transform duration-200"
            :class="{ 'rotate-180': isPropertiesExpanded }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Collapsible Content -->
        <div
          v-show="isPropertiesExpanded"
          class="flex flex-col gap-0.5 px-3 pb-3 max-h-[200px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div
            v-for="(prop, index) in nodeData.properties"
            :key="index"
            class="flex items-start gap-2 text-xs p-1.5 rounded hover:bg-white/5 transition-colors group"
          >
            <span
              v-if="prop.visibility"
              :class="['w-2 h-2 rounded-full flex-shrink-0 mt-1', getVisibilityColor(prop.visibility)]"
              :title="`${prop.visibility} visibility`"
            ></span>
            <span
              v-if="prop.visibility"
              class="text-text-secondary/60 font-mono text-[10px] flex-shrink-0 w-4"
              :title="`${prop.visibility} visibility`"
            >
              {{ getVisibilitySymbol(prop.visibility) }}
            </span>
            <div class="flex-1 min-w-0 font-mono">
              <span class="text-text-primary font-semibold">{{ prop.name }}</span>
              <span class="text-text-secondary">: </span>
              <span class="text-blue-300 break-all" :title="prop.type">{{ prop.type }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Methods Section -->
      <div v-if="nodeData.methods && nodeData.methods.length > 0" class="border-b border-border-default/50">
        <!-- Collapsible Header -->
        <button
          class="w-full flex items-center justify-between p-2 px-3 hover:bg-white/5 transition-colors text-left"
          @click="toggleMethods"
          type="button"
          :aria-expanded="isMethodsExpanded"
          aria-label="Toggle methods section"
        >
          <div class="flex items-center gap-2">
            <span class="text-text-secondary text-[10px] font-bold uppercase tracking-wide">Methods</span>
            <span class="text-text-secondary/60 text-[10px]">({{ nodeData.methods.length }})</span>
          </div>
          <svg
            class="w-3 h-3 text-text-secondary transition-transform duration-200"
            :class="{ 'rotate-180': isMethodsExpanded }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Collapsible Content -->
        <div
          v-show="isMethodsExpanded"
          class="flex flex-col gap-0.5 px-3 pb-3 max-h-[200px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div
            v-for="(method, index) in nodeData.methods"
            :key="index"
            class="flex items-start gap-2 text-xs p-1.5 rounded hover:bg-white/5 transition-colors group"
          >
            <span
              v-if="method.visibility"
              :class="['w-2 h-2 rounded-full flex-shrink-0 mt-1', getVisibilityColor(method.visibility)]"
              :title="`${method.visibility} visibility`"
            ></span>
            <span
              v-if="method.visibility"
              class="text-text-secondary/60 font-mono text-[10px] flex-shrink-0 w-4"
              :title="`${method.visibility} visibility`"
            >
              {{ getVisibilitySymbol(method.visibility) }}
            </span>
            <div class="flex-1 min-w-0 font-mono">
              <span class="text-text-primary font-semibold">{{ method.name }}</span>
              <span class="text-text-secondary">()</span>
              <span class="text-text-secondary">: </span>
              <span class="text-green-300" :title="method.returnType">{{ method.returnType }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="p-4 text-center text-text-secondary text-xs italic opacity-60">No properties or methods</div>

    <Handle type="source" :position="Position.Bottom" class="!w-3 !h-3" />
  </div>
</template>

<style scoped>
/* Smooth animations */
.transition-fast {
  transition: all 150ms ease-in-out;
}

/* Ensure text doesn't overflow */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.break-all {
  word-break: break-all;
}

/* Custom scrollbar for overflow sections */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Animation utilities */
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

.animate-in {
  animation:
    fade-in 0.2s ease-out,
    slide-in-from-top 0.2s ease-out;
}
</style>
