<template>
  <div class="analytics-dashboard" :class="{ 'dashboard-collapsed': collapsed }">
    <!-- Dashboard Header -->
    <div class="dashboard-header" @click="toggleCollapsed">
      <h3 class="dashboard-title">
        <span class="icon">📊</span>
        Graph Analytics
        <span v-if="!collapsed" class="toggle-icon">▼</span>
        <span v-else class="toggle-icon">▶</span>
      </h3>
    </div>

    <!-- Dashboard Content -->
    <div v-if="!collapsed" class="dashboard-content">
      <!-- Real-time Metrics -->
      <div class="metrics-section">
        <h4 class="section-title">Real-time Metrics</h4>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">{{ metrics?.totalNodes ?? 0 }}</div>
            <div class="metric-label">Total Nodes</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ metrics?.totalEdges ?? 0 }}</div>
            <div class="metric-label">Total Edges</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ metrics?.averageComplexity?.toFixed(1) ?? '0.0' }}</div>
            <div class="metric-label">Avg Complexity</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ metrics?.averageCoupling?.toFixed(1) ?? '0.0' }}</div>
            <div class="metric-label">Avg Coupling</div>
          </div>
        </div>
      </div>

      <!-- Health Indicators -->
      <div class="health-section">
        <h4 class="section-title">Health Indicators</h4>
        <div class="health-grid">
          <div class="health-card" :class="getHealthClass(metrics?.averageHealth ?? 0)">
            <div class="health-value">{{ metrics?.averageHealth?.toFixed(1) ?? '0.0' }}</div>
            <div class="health-label">Overall Health</div>
          </div>
          <div class="health-card" :class="getUnhealthyClass(metrics?.unhealthyNodes ?? 0)">
            <div class="health-value">{{ metrics?.unhealthyNodes ?? 0 }}</div>
            <div class="health-label">Unhealthy Nodes</div>
          </div>
        </div>
      </div>

      <!-- Distribution Charts -->
      <div class="distribution-section">
        <h4 class="section-title">Complexity Distribution</h4>
        <div class="distribution-chart">
          <div class="distribution-bar">
            <div class="bar-segment low" :style="{ width: getComplexityWidth('low') }">
              <span class="bar-label">Low: {{ metrics?.complexityDistribution?.low ?? 0 }}</span>
            </div>
            <div class="bar-segment medium" :style="{ width: getComplexityWidth('medium') }">
              <span class="bar-label">Medium: {{ metrics?.complexityDistribution?.medium ?? 0 }}</span>
            </div>
            <div class="bar-segment high" :style="{ width: getComplexityWidth('high') }">
              <span class="bar-label">High: {{ metrics?.complexityDistribution?.high ?? 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Alerts and Warnings -->
      <div v-if="alerts.length > 0" class="alerts-section">
        <h4 class="section-title">Alerts & Warnings</h4>
        <div class="alerts-list">
          <div v-for="(alert, index) in alerts" :key="index" class="alert-item" :class="getAlertClass(alert)">
            {{ alert }}
          </div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div v-if="config.enablePerformanceMetrics" class="performance-section">
        <h4 class="section-title">Performance</h4>
        <div class="performance-grid">
          <div class="performance-item">
            <span class="performance-label">Layout Time:</span>
            <span class="performance-value">{{ metrics?.layoutTime?.toFixed(1) ?? '0.0' }}ms</span>
          </div>
          <div class="performance-item">
            <span class="performance-label">Memory Usage:</span>
            <span class="performance-value">{{ metrics?.memoryUsage?.toFixed(1) ?? '0.0' }}MB</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

import { DEFAULT_ANALYTICS_CONFIG, GraphAnalyticsEngine } from '../analytics/graphAnalytics';

import type { AnalyticsConfig, AnalyticsMetrics } from '../analytics/graphAnalytics';

interface Props {
  nodes: any[];
  edges: any[];
  config?: AnalyticsConfig;
}

const props = withDefaults(defineProps<Props>(), {
  config: () => DEFAULT_ANALYTICS_CONFIG,
});

const collapsed = ref(false);
const metrics = ref<AnalyticsMetrics | null>(null);
const alerts = ref<string[]>([]);

let analyticsEngine: GraphAnalyticsEngine | null = null;

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value;
};

const getHealthClass = (health: number) => {
  if (health >= 8) return 'health-excellent';
  if (health >= 6) return 'health-good';
  if (health >= 4) return 'health-moderate';
  return 'health-poor';
};

const getUnhealthyClass = (count: number) => {
  if (count === 0) return 'unhealthy-none';
  if (count < 5) return 'unhealthy-low';
  return 'unhealthy-high';
};

const getComplexityWidth = (level: 'low' | 'medium' | 'high') => {
  if (!metrics.value?.complexityDistribution) return '0%';

  const total =
    metrics.value.complexityDistribution.low +
    metrics.value.complexityDistribution.medium +
    metrics.value.complexityDistribution.high;

  if (total === 0) return '0%';

  const value = metrics.value.complexityDistribution[level];
  return `${(value / total) * 100}%`;
};

const getAlertClass = (alert: string) => {
  if (alert.includes('🔴')) return 'alert-critical';
  if (alert.includes('🟡')) return 'alert-warning';
  return 'alert-info';
};

const updateAnalytics = () => {
  if (!analyticsEngine) return;

  metrics.value = analyticsEngine.calculateAnalytics(props.nodes, props.edges);
  alerts.value = [
    ...analyticsEngine.getHealthAlerts(),
    ...analyticsEngine.getComplexityWarnings(),
    ...analyticsEngine.getCouplingAlerts(),
  ];
};

onMounted(() => {
  analyticsEngine = new GraphAnalyticsEngine(props.config);
  updateAnalytics();

  if (props.config.enableRealTime) {
    analyticsEngine.startRealTimeUpdates(props.nodes, props.edges, (newMetrics) => {
      metrics.value = newMetrics;
      alerts.value = [
        ...analyticsEngine!.getHealthAlerts(),
        ...analyticsEngine!.getComplexityWarnings(),
        ...analyticsEngine!.getCouplingAlerts(),
      ];
    });
  }
});

onUnmounted(() => {
  if (analyticsEngine) {
    analyticsEngine.stopRealTimeUpdates();
  }
});
</script>

<style scoped>
@import 'tailwindcss';

.analytics-dashboard {
  @apply fixed top-5 right-5 w-80 rounded-lg shadow-xl z-1000 transition-all duration-300;
  @apply border border-gray-300;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.dashboard-collapsed {
  @apply w-[200px];
}

.dashboard-header {
  @apply px-4 py-3 bg-gray-50 border-b border-gray-300 cursor-pointer select-none;
}

.dashboard-title {
  @apply m-0 text-sm font-semibold text-gray-800 flex items-center justify-between;
}

.icon {
  @apply mr-2;
}

.toggle-icon {
  @apply text-xs text-gray-600;
}

.dashboard-content {
  @apply p-4 max-h-[400px] overflow-y-auto;
}

.section-title {
  @apply m-0 mb-3 text-xs font-semibold text-gray-600 uppercase tracking-wide;
}

.metrics-grid {
  @apply grid grid-cols-2 gap-2 mb-4;
}

.metric-card {
  @apply bg-gray-50 p-3 rounded-md text-center border border-gray-300;
}

.metric-value {
  @apply text-lg font-bold text-gray-800 mb-1;
}

.metric-label {
  @apply text-[10px] text-gray-600 uppercase tracking-wide;
}

.health-grid {
  @apply grid grid-cols-2 gap-2 mb-4;
}

.health-card {
  @apply p-3 rounded-md text-center border;
}

.health-excellent {
  @apply bg-green-100 border-green-300 text-green-800;
}

.health-good {
  @apply bg-cyan-100 border-cyan-300 text-cyan-800;
}

.health-moderate {
  @apply bg-yellow-100 border-yellow-300 text-yellow-800;
}

.health-poor {
  @apply bg-red-100 border-red-300 text-red-800;
}

.unhealthy-none {
  @apply bg-green-100 border-green-300 text-green-800;
}

.unhealthy-low {
  @apply bg-yellow-100 border-yellow-300 text-yellow-800;
}

.unhealthy-high {
  @apply bg-red-100 border-red-300 text-red-800;
}

.health-value {
  @apply text-base font-bold mb-1;
}

.health-label {
  @apply text-[10px] uppercase tracking-wide;
}

.distribution-chart {
  @apply mb-4;
}

.distribution-bar {
  @apply flex h-6 rounded overflow-hidden border border-gray-300;
}

.bar-segment {
  @apply flex items-center justify-center text-white text-[10px] font-semibold;
}

.bar-segment.low {
  @apply bg-green-600;
}

.bar-segment.medium {
  @apply bg-yellow-500;
}

.bar-segment.high {
  @apply bg-red-600;
}

.bar-label {
  @apply text-[9px];
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.alerts-section {
  @apply mb-4;
}

.alerts-list {
  @apply flex flex-col gap-1.5;
}

.alert-item {
  @apply px-3 py-2 rounded text-[11px] font-medium border-l-[3px];
}

.alert-critical {
  @apply bg-red-100 border-red-600 text-red-900;
}

.alert-warning {
  @apply bg-yellow-100 border-yellow-500 text-yellow-900;
}

.alert-info {
  @apply bg-cyan-100 border-cyan-600 text-cyan-900;
}

.performance-section {
  @apply mb-4;
}

.performance-grid {
  @apply flex flex-col gap-1.5;
}

.performance-item {
  @apply flex justify-between items-center px-2 py-1.5 bg-gray-50 rounded text-[11px];
}

.performance-label {
  @apply text-gray-600 font-medium;
}

.performance-value {
  @apply text-gray-800 font-semibold font-mono;
}
</style>
