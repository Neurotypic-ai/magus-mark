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
import { computed, onMounted, onUnmounted, ref } from 'vue';

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
.analytics-dashboard {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  z-index: 1000;
  transition: all 0.3s ease;
}

.dashboard-collapsed {
  width: 200px;
}

.dashboard-header {
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  user-select: none;
}

.dashboard-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.icon {
  margin-right: 8px;
}

.toggle-icon {
  font-size: 12px;
  color: #666;
}

.dashboard-content {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.metric-card {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #e0e0e0;
}

.metric-value {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.health-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.health-card {
  padding: 12px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid;
}

.health-excellent {
  background: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

.health-good {
  background: #d1ecf1;
  border-color: #bee5eb;
  color: #0c5460;
}

.health-moderate {
  background: #fff3cd;
  border-color: #ffeaa7;
  color: #856404;
}

.health-poor {
  background: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.unhealthy-none {
  background: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

.unhealthy-low {
  background: #fff3cd;
  border-color: #ffeaa7;
  color: #856404;
}

.unhealthy-high {
  background: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.health-value {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}

.health-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.distribution-chart {
  margin-bottom: 16px;
}

.distribution-bar {
  display: flex;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: 600;
}

.bar-segment.low {
  background: #28a745;
}

.bar-segment.medium {
  background: #ffc107;
}

.bar-segment.high {
  background: #dc3545;
}

.bar-label {
  font-size: 9px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.alerts-section {
  margin-bottom: 16px;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.alert-item {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  border-left: 3px solid;
}

.alert-critical {
  background: #f8d7da;
  border-color: #dc3545;
  color: #721c24;
}

.alert-warning {
  background: #fff3cd;
  border-color: #ffc107;
  color: #856404;
}

.alert-info {
  background: #d1ecf1;
  border-color: #17a2b8;
  color: #0c5460;
}

.performance-section {
  margin-bottom: 16px;
}

.performance-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.performance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 11px;
}

.performance-label {
  color: #666;
  font-weight: 500;
}

.performance-value {
  color: #333;
  font-weight: 600;
  font-family: monospace;
}
</style>
