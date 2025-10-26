<script setup lang="ts">
import { useVueFlow } from '@vue-flow/core';
import { computed, nextTick, onMounted, ref } from 'vue';

import BaseNode from './BaseNode.vue';

import type { DependencyProps } from '../types';

const props = defineProps<DependencyProps>();

const nodeData = computed(() => props.data);
const nodeType = computed(() => props.type);

// Ask VueFlow to recompute node dimensions when content changes
const { updateNodeInternals } = useVueFlow();

onMounted(async () => {
  await nextTick();
  updateNodeInternals([props.id]);
});

// Collapsible sections state
const isPropertiesExpanded = ref(true);
const isMethodsExpanded = ref(true);

const toggleProperties = async () => {
  isPropertiesExpanded.value = !isPropertiesExpanded.value;
  await nextTick();
  updateNodeInternals([props.id]);
};

const toggleMethods = async () => {
  isMethodsExpanded.value = !isMethodsExpanded.value;
  await nextTick();
  updateNodeInternals([props.id]);
};

// Compute visibility color class and icon
const getVisibilityColor = (visibility: string) => {
  if (visibility === 'public') return 'visibility-public-symbol';
  if (visibility === 'protected') return 'visibility-protected-symbol';
  return 'visibility-private-symbol';
};

const getVisibilitySymbol = (visibility: string) => {
  if (visibility === 'public') return '+';
  if (visibility === 'protected') return '#';
  return '-';
};

// Get type-specific styling
const getTypeColor = computed(() => {
  switch (nodeType.value) {
    case 'class':
      return 'type-class';
    case 'interface':
      return 'type-interface';
    case 'enum':
      return 'type-enum';
    case 'type':
      return 'type-type';
    default:
      return 'type-default';
  }
});

const hasContent = computed(() => {
  const hasProps = nodeData.value.properties && nodeData.value.properties.length > 0;
  const hasMethods = nodeData.value.methods && nodeData.value.methods.length > 0;
  return hasProps || hasMethods;
});

// Badge text is the node type uppercased
const badgeText = computed(() => String(nodeType.value).toUpperCase());
</script>

<template>
  <BaseNode v-bind="props" :badge-text="badgeText" :badge-class="getTypeColor" :z-index="2" min-width="280px">
    <template #content>
      <!-- Node Content -->
      <div v-if="hasContent" class="symbol-content">
        <!-- Properties Section -->
        <div v-if="nodeData.properties && nodeData.properties.length > 0" class="collapsible-section">
          <!-- Collapsible Header -->
          <button
            class="collapsible-header"
            @click="toggleProperties"
            type="button"
            :aria-expanded="isPropertiesExpanded"
            aria-label="Toggle properties section"
          >
            <div class="collapsible-header-label">
              <span class="section-title">Properties</span>
              <span class="section-count">({{ nodeData.properties.length }})</span>
            </div>
            <svg
              class="collapsible-icon"
              :class="{ 'collapsible-icon-expanded': isPropertiesExpanded }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Collapsible Content -->
          <div v-show="isPropertiesExpanded" class="collapsible-content">
            <div v-for="(prop, index) in nodeData.properties" :key="index" class="member-item">
              <span
                v-if="prop.visibility"
                :class="['visibility-dot', getVisibilityColor(prop.visibility)]"
                :title="`${prop.visibility} visibility`"
              ></span>
              <span v-if="prop.visibility" class="visibility-symbol" :title="`${prop.visibility} visibility`">
                {{ getVisibilitySymbol(prop.visibility) }}
              </span>
              <div class="member-signature">
                <span class="member-name">{{ prop.name }}</span>
                <span class="member-separator">: </span>
                <span class="member-type-property" :title="prop.type">{{ prop.type }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Methods Section -->
        <div v-if="nodeData.methods && nodeData.methods.length > 0" class="collapsible-section">
          <!-- Collapsible Header -->
          <button
            class="collapsible-header"
            @click="toggleMethods"
            type="button"
            :aria-expanded="isMethodsExpanded"
            aria-label="Toggle methods section"
          >
            <div class="collapsible-header-label">
              <span class="section-title">Methods</span>
              <span class="section-count">({{ nodeData.methods.length }})</span>
            </div>
            <svg
              class="collapsible-icon"
              :class="{ 'collapsible-icon-expanded': isMethodsExpanded }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Collapsible Content -->
          <div v-show="isMethodsExpanded" class="collapsible-content">
            <div v-for="(method, index) in nodeData.methods" :key="index" class="member-item">
              <span
                v-if="method.visibility"
                :class="['visibility-dot', getVisibilityColor(method.visibility)]"
                :title="`${method.visibility} visibility`"
              ></span>
              <span v-if="method.visibility" class="visibility-symbol" :title="`${method.visibility} visibility`">
                {{ getVisibilitySymbol(method.visibility) }}
              </span>
              <div class="member-signature">
                <span class="member-name">{{ method.name }}</span>
                <span class="member-separator">()</span>
                <span class="member-separator">: </span>
                <span class="member-type-method" :title="method.returnType">{{ method.returnType }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #empty>
      <!-- Empty State -->
      <div v-if="!hasContent" class="symbol-empty-state">No properties or methods</div>
    </template>
  </BaseNode>
</template>

<style scoped>
@import 'tailwindcss' reference;

/* Type-specific Badge Colors */
.type-class {
  @apply bg-blue-500/20 text-blue-300;
}

.type-interface {
  @apply bg-purple-500/20 text-purple-300;
}

.type-enum {
  @apply bg-orange-500/20 text-orange-300;
}

.type-type {
  @apply bg-teal-500/20 text-teal-300;
}

.type-default {
  @apply bg-white/10;
  color: var(--text-secondary);
}

/* Collapsible Section */
.collapsible-section {
  @apply border-b;
  border-color: rgba(var(--border-default-rgb), 0.5);
}

.collapsible-header {
  @apply w-full flex items-center justify-between px-3 py-2 transition-colors duration-200;
  @apply text-left bg-transparent border-none cursor-pointer;
}

.collapsible-header:hover {
  @apply bg-white/5;
}

.collapsible-header-label {
  @apply flex items-center gap-2;
}

.section-title {
  @apply text-[0.625rem] font-bold uppercase tracking-wide;
  color: var(--text-secondary);
}

.section-count {
  @apply text-white/60 text-[0.625rem];
}

.collapsible-icon {
  @apply w-3 h-3 transition-transform duration-200;
  color: var(--text-secondary);
}

.collapsible-icon-expanded {
  @apply rotate-180;
}

.collapsible-content {
  @apply flex flex-col gap-0.5 px-3 pb-3 overflow-y-auto;
  animation:
    fade-in 200ms ease-out,
    slide-in-from-top 200ms ease-out;
}

/* Custom Scrollbar */
.collapsible-content::-webkit-scrollbar {
  @apply w-1.5;
}

.collapsible-content::-webkit-scrollbar-track {
  @apply bg-white/5 rounded;
}

.collapsible-content::-webkit-scrollbar-thumb {
  @apply bg-white/20 rounded;
}

.collapsible-content::-webkit-scrollbar-thumb:hover {
  @apply bg-white/30;
}

/* Member Item */
.member-item {
  @apply flex items-start gap-2 text-xs leading-4 p-1.5 rounded transition-colors duration-200;
}

.member-item:hover {
  @apply bg-white/5;
}

/* Visibility Indicators */
.visibility-dot {
  @apply w-2 h-2 rounded-full shrink-0 mt-1;
}

.visibility-public-symbol {
  @apply bg-green-500;
}

.visibility-protected-symbol {
  @apply bg-yellow-500;
}

.visibility-private-symbol {
  @apply bg-red-500;
}

.visibility-symbol {
  @apply text-white/60 font-mono text-[0.625rem] shrink-0 w-4;
}

/* Member Signature */
.member-signature {
  @apply flex-1 font-mono;
}

.member-name {
  @apply font-semibold;
  color: var(--text-primary);
}

.member-separator {
  color: var(--text-secondary);
}

.member-type-property {
  @apply text-blue-300;
}

.member-type-method {
  @apply text-green-300;
}

/* Empty State */
.symbol-empty-state {
  @apply p-4 text-center text-xs leading-4 italic opacity-60;
  color: var(--text-secondary);
}
</style>
