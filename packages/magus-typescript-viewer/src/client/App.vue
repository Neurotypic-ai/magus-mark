<script setup lang="ts">
import { defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';

import { createLogger } from '../shared/utils/logger';
import { GraphDataAssembler } from './assemblers/GraphDataAssembler';
import ErrorBoundary from './components/ErrorBoundary.vue';
import { graphTheme } from './theme/graphTheme';

import type { DependencyPackageGraph } from './components/DependencyGraph/types';

// Lazy load the DependencyGraph component for code splitting and better performance
const DependencyGraph = defineAsyncComponent(() => import('./components/DependencyGraph/DependencyGraphLazy.vue'));

// Create an app-specific logger
const appLogger = createLogger('App');
const graphDataAssembler = new GraphDataAssembler();

const graphData = ref<DependencyPackageGraph>({ packages: [] });
const isLoading = ref(true);
const error = ref<string | null>(null);

let mounted = true;
let controller: AbortController | null = null;

const fetchData = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    // Create an AbortController for cleanup
    controller = new AbortController();
    const signal = controller.signal;

    appLogger.debug('Fetching graph data...');

    // Add signal to fetch operations inside assembleGraphData
    // This way we can abort the fetch if the component unmounts
    const data = await graphDataAssembler.assembleGraphData(signal);

    if (!mounted) return;

    appLogger.debug('Setting graph data...');
    graphData.value = data;
    isLoading.value = false;
  } catch (err) {
    if (!mounted) return;
    // Ignore aborted fetch errors
    if (err instanceof DOMException && err.name === 'AbortError') {
      appLogger.debug('Fetch operation was aborted');
      return;
    }
    appLogger.error('Error fetching data:', err);
    error.value = err instanceof Error ? err.message : 'An unknown error occurred';
    isLoading.value = false;
  }
};

const retryLoad = () => {
  window.location.reload();
};

onMounted(() => {
  void fetchData();
});

onUnmounted(() => {
  mounted = false;
  if (controller) {
    controller.abort();
  }
});
</script>

<template>
  <!-- Loading State -->
  <div
    v-if="isLoading"
    class="flex justify-center items-center h-screen text-white"
    :style="{ backgroundColor: graphTheme.nodes.colors.background.default }"
    role="status"
    aria-live="polite"
  >
    <p>Loading dependency graph...</p>
  </div>

  <!-- Error State -->
  <div
    v-else-if="error"
    class="flex flex-col justify-center items-center h-screen p-8 text-red-500"
    :style="{ backgroundColor: graphTheme.nodes.colors.background.default }"
    role="alert"
    aria-live="assertive"
  >
    <h1 class="text-2xl font-bold mb-4">Error Loading Graph</h1>
    <p class="mb-4">{{ error }}</p>
    <button
      @click="retryLoad"
      class="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors cursor-pointer"
    >
      Retry
    </button>
  </div>

  <!-- Graph View -->
  <ErrorBoundary v-else>
    <Suspense>
      <template #default>
        <DependencyGraph :data="graphData" />
      </template>
      <template #fallback>
        <div
          class="flex justify-center items-center h-screen text-white"
          :style="{ backgroundColor: graphTheme.nodes.colors.background.default }"
          role="status"
          aria-live="polite"
        >
          <p>Loading dependency graph...</p>
        </div>
      </template>
    </Suspense>
  </ErrorBoundary>
</template>
