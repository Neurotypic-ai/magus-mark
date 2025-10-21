<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';

import DependencyGraph from './index.vue';

import type { DependencyGraphProps } from './index.vue';

/**
 * Performance metrics tracking for the DependencyGraph component
 */
class PerformanceMetrics {
  private static instance: PerformanceMetrics | null = null;
  private renderTimes: number[] = [];
  private interactionTimes: number[] = [];

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): PerformanceMetrics {
    return (PerformanceMetrics.instance ??= new PerformanceMetrics());
  }

  public trackRenderTime(time: number): void {
    this.renderTimes.push(time);
    if (this.renderTimes.length > 10) {
      this.renderTimes.shift();
    }
  }

  public trackInteraction(_type: string, time: number): void {
    this.interactionTimes.push(time);
    if (this.interactionTimes.length > 20) {
      this.interactionTimes.shift();
    }
  }

  public getAverageRenderTime(): number {
    if (this.renderTimes.length === 0) return 0;
    const sum = this.renderTimes.reduce((a, b) => a + b, 0);
    return sum / this.renderTimes.length;
  }

  public getAverageInteractionTime(): number {
    if (this.interactionTimes.length === 0) return 0;
    const sum = this.interactionTimes.reduce((a, b) => a + b, 0);
    return sum / this.interactionTimes.length;
  }
}

const props = defineProps<DependencyGraphProps>();

// Get the singleton instance of PerformanceMetrics
const metrics = PerformanceMetrics.getInstance();

// Store cleanup functions to ensure proper removal
const cleanupFunctions = ref<Array<() => void>>([]);

/**
 * Waits for stylesheets and fonts to be fully loaded before querying DOM
 * This prevents FOUC (Flash of Unstyled Content) warnings
 */
async function waitForStylesLoaded(): Promise<void> {
  // Wait for Vue to update the DOM
  await nextTick();

  // Wait for fonts to be ready (includes external fonts like Google Fonts)
  if ('fonts' in document) {
    await document.fonts.ready;
  }

  // Wait for next browser paint to ensure styles are applied
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

onMounted(() => {
  // Create a mark for the start of component rendering
  performance.mark('graph-render-start');

  // Set up interaction observers after styles are loaded
  void waitForStylesLoaded().then(() => {
    // Set up interaction observers
    const trackInteraction = (type: string, callback: () => void) => {
      return () => {
        const start = performance.now();
        callback();
        const end = performance.now();
        metrics.trackInteraction(type, end - start);
      };
    };

    // Set up event listeners for common interactions
    const graphElement = document.querySelector('[role="application"]');
    if (graphElement) {
      const trackMousemove = trackInteraction('mousemove', () => {
        /* Track mousemove */
      });
      const trackClick = trackInteraction('click', () => {
        /* Track click */
      });
      const trackWheel = trackInteraction('wheel', () => {
        /* Track wheel */
      });

      graphElement.addEventListener('mousemove', trackMousemove, { passive: true });
      graphElement.addEventListener('click', trackClick);
      graphElement.addEventListener('wheel', trackWheel, { passive: true });

      // Store cleanup functions
      cleanupFunctions.value.push(
        () => graphElement.removeEventListener('mousemove', trackMousemove),
        () => graphElement.removeEventListener('click', trackClick),
        () => graphElement.removeEventListener('wheel', trackWheel)
      );
    }
  });
});

onUnmounted(() => {
  // Clean up event listeners
  cleanupFunctions.value.forEach((cleanup) => cleanup());
  cleanupFunctions.value = [];

  // Measure render time on component unmount
  performance.mark('graph-render-end');
  performance.measure('graph-render', 'graph-render-start', 'graph-render-end');

  const entries = performance.getEntriesByName('graph-render');
  if (entries.length > 0) {
    const duration = entries[0]?.duration ?? 0;
    metrics.trackRenderTime(duration);

    // Clean up performance marks and measures
    performance.clearMarks('graph-render-start');
    performance.clearMarks('graph-render-end');
    performance.clearMeasures('graph-render');
  }
});
</script>

<template>
  <DependencyGraph :data="props.data" />
</template>
