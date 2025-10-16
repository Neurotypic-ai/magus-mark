<script setup lang="ts">
import type { DependencyNode } from '../types';

interface NodeDetailsProps {
  node: DependencyNode;
}

const props = defineProps<NodeDetailsProps>();
</script>

<template>
  <div class="fixed top-4 right-4 bg-background-paper p-4 rounded-lg border border-gray-700 shadow-lg max-w-md max-h-96 overflow-y-auto">
    <h2 class="text-xl font-bold text-white mb-2">{{ props.node.data?.label }}</h2>
    <p class="text-sm text-gray-400 mb-4">Type: {{ props.node.type }}</p>

    <!-- Properties Section -->
    <div v-if="props.node.data?.properties && props.node.data?.properties.length > 0" class="mb-4">
      <strong class="text-sm text-gray-300">Properties:</strong>
      <div v-for="prop in props.node.data?.properties" :key="prop.name" class="text-sm text-gray-400 ml-2 mt-1">
        {{ prop.name }}: {{ prop.type }}
      </div>
    </div>

    <!-- Methods Section -->
    <div v-if="props.node.data?.methods && props.node.data?.methods.length > 0" class="mb-4">
      <strong class="text-sm text-gray-300">Methods:</strong>
      <div v-for="method in props.node.data?.methods" :key="method.name" class="text-sm text-gray-400 ml-2 mt-1">
        {{ method.name }}(): {{ method.returnType }}
      </div>
    </div>

    <!-- Imports Section -->
    <div v-if="props.node.data?.imports && props.node.data?.imports.length > 0" class="mb-4">
      <strong class="text-sm text-gray-300">Imports:</strong>
      <div v-for="(imp, index) in props.node.data?.imports" :key="index" class="text-sm text-gray-400 ml-2 mt-1">
        {{ imp }}
      </div>
    </div>

    <!-- Exports Section -->
    <div v-if="props.node.data?.exports && props.node.data?.exports.length > 0" class="mb-4">
      <strong class="text-sm text-gray-300">Exports:</strong>
      <div v-for="(exp, index) in props.node.data?.exports" :key="index" class="text-sm text-gray-400 ml-2 mt-1">
        {{ exp }}
      </div>
    </div>
  </div>
</template>
