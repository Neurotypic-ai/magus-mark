import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { createLogger } from '../../shared/utils/logger';

import type { DependencyKind } from '../components/DependencyGraph/types';

const logger = createLogger('graphSettings');
const STORAGE_KEY = 'magus-graph-settings';

interface PersistedSettings {
  showPackages: boolean;
  showClasses: boolean;
  clusterByFolder: boolean;
  visibleNodeTypes: string[];
  layoutDirection: 'LR' | 'RL' | 'TB' | 'BT';
  nodeSpacing: number;
  rankSpacing: number;
  enabledRelationshipTypes: string[];
  // Enhanced layout options
  useMultiAlgorithm: boolean;
  layoutStrategy: 'balanced' | 'performance' | 'detailed';
  forceDirectedConfig: {
    iterations: number;
    strength: number;
    distance: number;
    damping: number;
  };
  gridConfig: {
    cellSize: number;
    padding: number;
  };
  // Smart clustering options
  useSmartClustering: boolean;
  clusteringOptions: {
    dependencyBased: boolean;
    complexityBased: boolean;
    couplingBased: boolean;
    temporalBased: boolean;
    customMetrics: string[];
  };
  // Visual hierarchy options
  useVisualHierarchy: boolean;
  visualHierarchyConfig: {
    sizeByComplexity: boolean;
    sizeByCoupling: boolean;
    sizeByImportance: boolean;
    colorByComplexity: boolean;
    colorByCoupling: boolean;
    colorByHealth: boolean;
    showComplexityBadge: boolean;
    showCouplingIndicator: boolean;
    showHealthIndicator: boolean;
    showImportanceGlow: boolean;
    sizeMultiplier: number;
    colorIntensity: number;
    indicatorSize: number;
  };
}

function isPersistedSettings(value: unknown): value is PersistedSettings {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['showPackages'] === 'boolean' &&
    typeof obj['showClasses'] === 'boolean' &&
    typeof obj['clusterByFolder'] === 'boolean' &&
    Array.isArray(obj['visibleNodeTypes']) &&
    obj['visibleNodeTypes'].every((item) => typeof item === 'string') &&
    (obj['layoutDirection'] === undefined ||
      obj['layoutDirection'] === 'LR' ||
      obj['layoutDirection'] === 'RL' ||
      obj['layoutDirection'] === 'TB' ||
      obj['layoutDirection'] === 'BT') &&
    (obj['nodeSpacing'] === undefined || typeof obj['nodeSpacing'] === 'number') &&
    (obj['rankSpacing'] === undefined || typeof obj['rankSpacing'] === 'number') &&
    (obj['enabledRelationshipTypes'] === undefined ||
      (Array.isArray(obj['enabledRelationshipTypes']) &&
        obj['enabledRelationshipTypes'].every((item) => typeof item === 'string'))) &&
    (obj['useMultiAlgorithm'] === undefined || typeof obj['useMultiAlgorithm'] === 'boolean') &&
    (obj['layoutStrategy'] === undefined || typeof obj['layoutStrategy'] === 'string') &&
    (obj['forceDirectedConfig'] === undefined || typeof obj['forceDirectedConfig'] === 'object') &&
    (obj['gridConfig'] === undefined || typeof obj['gridConfig'] === 'object') &&
    (obj['useSmartClustering'] === undefined || typeof obj['useSmartClustering'] === 'boolean') &&
    (obj['clusteringOptions'] === undefined || typeof obj['clusteringOptions'] === 'object')
  );
}

// Load settings from localStorage
function loadSettings(): PersistedSettings | null {
  logger.debug('Loading settings from localStorage');
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (isPersistedSettings(parsed)) {
        logger.debug('Loaded persisted settings:', parsed);
        return parsed;
      } else {
        logger.warn('Invalid settings format in localStorage, using defaults');
      }
    } else {
      logger.debug('No persisted settings found, using defaults');
    }
  } catch (error) {
    logger.error('Failed to load graph settings from localStorage', error);
  }
  return null;
}

// Save settings to localStorage
function saveSettings(settings: {
  showPackages: boolean;
  showClasses: boolean;
  clusterByFolder: boolean;
  visibleNodeTypes: string[];
  layoutDirection: 'LR' | 'RL' | 'TB' | 'BT';
  nodeSpacing: number;
  rankSpacing: number;
  enabledRelationshipTypes: string[];
  useMultiAlgorithm: boolean;
  layoutStrategy: 'balanced' | 'performance' | 'detailed';
  forceDirectedConfig: {
    iterations: number;
    strength: number;
    distance: number;
    damping: number;
  };
  gridConfig: {
    cellSize: number;
    padding: number;
  };
  // Smart clustering options
  useSmartClustering: boolean;
  clusteringOptions: {
    dependencyBased: boolean;
    complexityBased: boolean;
    couplingBased: boolean;
    temporalBased: boolean;
    customMetrics: string[];
  };
  // Visual hierarchy options
  useVisualHierarchy: boolean;
  visualHierarchyConfig: {
    sizeByComplexity: boolean;
    sizeByCoupling: boolean;
    sizeByImportance: boolean;
    colorByComplexity: boolean;
    colorByCoupling: boolean;
    colorByHealth: boolean;
    showComplexityBadge: boolean;
    showCouplingIndicator: boolean;
    showHealthIndicator: boolean;
    showImportanceGlow: boolean;
    sizeMultiplier: number;
    colorIntensity: number;
    indicatorSize: number;
  };
}) {
  logger.debug('Saving settings to localStorage:', settings);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    logger.debug('Settings saved successfully');
  } catch (error) {
    logger.error('Failed to save graph settings to localStorage', error);
  }
}

export const useGraphSettings = defineStore('graphSettings', () => {
  logger.info('Initializing graph settings store');
  // Load persisted settings
  const persisted = loadSettings();

  // View options - what level of detail to show
  const showPackages = ref<boolean>(persisted?.showPackages ?? false);
  const showClasses = ref<boolean>(persisted?.showClasses ?? false);
  logger.debug(
    `Initial view options - showPackages: ${String(showPackages.value)}, showClasses: ${String(showClasses.value)}`
  );

  // Clustering options
  const clusterByFolder = ref<boolean>(persisted?.clusterByFolder ?? false);
  logger.debug(`Initial clustering - clusterByFolder: ${String(clusterByFolder.value)}`);

  // Symbol type visibility settings - only applies when showClasses is true
  // All symbol types visible by default
  const defaultNodeTypes: DependencyKind[] = ['class', 'interface', 'enum', 'type', 'function'];
  const visibleNodeTypes = ref<Set<DependencyKind>>(
    new Set<DependencyKind>(persisted ? (persisted.visibleNodeTypes as DependencyKind[]) : defaultNodeTypes)
  );
  logger.debug('Initial visible node types:', Array.from(visibleNodeTypes.value));

  // Layout configuration
  const layoutDirection = ref<'LR' | 'RL' | 'TB' | 'BT'>(persisted?.layoutDirection ?? 'LR');
  const nodeSpacing = ref<number>(persisted?.nodeSpacing ?? 150);
  const rankSpacing = ref<number>(persisted?.rankSpacing ?? 250);
  logger.debug(
    `Initial layout - direction: ${layoutDirection.value}, nodeSpacing: ${String(nodeSpacing.value)}, rankSpacing: ${String(rankSpacing.value)}`
  );

  // Relationship type filters - all enabled by default
  const defaultRelationshipTypes = [
    'import',
    'export',
    'inheritance',
    'implements',
    'contains',
    'dependency',
    'devDependency',
    'peerDependency',
  ];
  const enabledRelationshipTypes = ref<string[]>(persisted?.enabledRelationshipTypes ?? defaultRelationshipTypes);
  logger.debug('Initial enabled relationship types:', enabledRelationshipTypes.value);

  // Enhanced layout options
  const useMultiAlgorithm = ref<boolean>(persisted?.useMultiAlgorithm ?? false);
  const layoutStrategy = ref<'balanced' | 'performance' | 'detailed'>(persisted?.layoutStrategy ?? 'balanced');
  const forceDirectedConfig = ref({
    iterations: persisted?.forceDirectedConfig.iterations ?? 100,
    strength: persisted?.forceDirectedConfig.strength ?? 0.1,
    distance: persisted?.forceDirectedConfig.distance ?? 200,
    damping: persisted?.forceDirectedConfig.damping ?? 0.8,
  });
  const gridConfig = ref({
    cellSize: persisted?.gridConfig.cellSize ?? 300,
    padding: persisted?.gridConfig.padding ?? 50,
  });

  // Smart clustering options
  const useSmartClustering = ref<boolean>(persisted?.useSmartClustering ?? false);
  const clusteringOptions = ref({
    dependencyBased: persisted?.clusteringOptions.dependencyBased ?? true,
    complexityBased: persisted?.clusteringOptions.complexityBased ?? true,
    couplingBased: persisted?.clusteringOptions.couplingBased ?? true,
    temporalBased: persisted?.clusteringOptions.temporalBased ?? false,
    customMetrics: persisted?.clusteringOptions.customMetrics ?? [],
  });

  // Visual hierarchy options
  const useVisualHierarchy = ref<boolean>(persisted?.useVisualHierarchy ?? false);
  const visualHierarchyConfig = ref({
    sizeByComplexity: persisted?.visualHierarchyConfig.sizeByComplexity ?? true,
    sizeByCoupling: persisted?.visualHierarchyConfig.sizeByCoupling ?? false,
    sizeByImportance: persisted?.visualHierarchyConfig.sizeByImportance ?? true,
    colorByComplexity: persisted?.visualHierarchyConfig.colorByComplexity ?? true,
    colorByCoupling: persisted?.visualHierarchyConfig.colorByCoupling ?? false,
    colorByHealth: persisted?.visualHierarchyConfig.colorByHealth ?? true,
    showComplexityBadge: persisted?.visualHierarchyConfig.showComplexityBadge ?? true,
    showCouplingIndicator: persisted?.visualHierarchyConfig.showCouplingIndicator ?? true,
    showHealthIndicator: persisted?.visualHierarchyConfig.showHealthIndicator ?? true,
    showImportanceGlow: persisted?.visualHierarchyConfig.showImportanceGlow ?? true,
    sizeMultiplier: persisted?.visualHierarchyConfig.sizeMultiplier ?? 1.0,
    colorIntensity: persisted?.visualHierarchyConfig.colorIntensity ?? 0.7,
    indicatorSize: persisted?.visualHierarchyConfig.indicatorSize ?? 12,
  });
  logger.debug('Initial enhanced layout options:', {
    useMultiAlgorithm: useMultiAlgorithm.value,
    layoutStrategy: layoutStrategy.value,
    forceDirectedConfig: forceDirectedConfig.value,
    gridConfig: gridConfig.value,
  });

  // Watch for changes and persist to localStorage
  watch(
    [
      showPackages,
      showClasses,
      clusterByFolder,
      visibleNodeTypes,
      layoutDirection,
      nodeSpacing,
      rankSpacing,
      enabledRelationshipTypes,
      useMultiAlgorithm,
      layoutStrategy,
      forceDirectedConfig,
      gridConfig,
      useSmartClustering,
      clusteringOptions,
      useVisualHierarchy,
      visualHierarchyConfig,
    ],
    () => {
      saveSettings({
        showPackages: showPackages.value,
        showClasses: showClasses.value,
        clusterByFolder: clusterByFolder.value,
        visibleNodeTypes: Array.from(visibleNodeTypes.value),
        layoutDirection: layoutDirection.value,
        nodeSpacing: nodeSpacing.value,
        rankSpacing: rankSpacing.value,
        enabledRelationshipTypes: enabledRelationshipTypes.value,
        useMultiAlgorithm: useMultiAlgorithm.value,
        layoutStrategy: layoutStrategy.value,
        forceDirectedConfig: forceDirectedConfig.value,
        gridConfig: gridConfig.value,
        useSmartClustering: useSmartClustering.value,
        clusteringOptions: clusteringOptions.value,
        useVisualHierarchy: useVisualHierarchy.value,
        visualHierarchyConfig: visualHierarchyConfig.value,
      });
    },
    { deep: true }
  );

  function setShowPackages(value: boolean): void {
    logger.debug(`setShowPackages: ${String(showPackages.value)} -> ${String(value)}`);
    showPackages.value = value;
  }

  function setShowClasses(value: boolean): void {
    logger.debug(`setShowClasses: ${String(showClasses.value)} -> ${String(value)}`);
    showClasses.value = value;
  }

  function setClusterByFolder(value: boolean): void {
    logger.debug(`setClusterByFolder: ${String(clusterByFolder.value)} -> ${String(value)}`);
    clusterByFolder.value = value;
  }

  function setNodeTypeVisibility(nodeType: DependencyKind, visible: boolean): void {
    logger.debug(`setNodeTypeVisibility: ${nodeType} -> ${String(visible)}`);
    if (visible) {
      visibleNodeTypes.value.add(nodeType);
    } else {
      visibleNodeTypes.value.delete(nodeType);
    }
    // Trigger reactivity by creating new Set
    visibleNodeTypes.value = new Set(visibleNodeTypes.value);
    logger.debug('Updated visible node types:', Array.from(visibleNodeTypes.value));
    // Manually persist since Set changes may not trigger watcher reliably
    saveSettings({
      showPackages: showPackages.value,
      showClasses: showClasses.value,
      clusterByFolder: clusterByFolder.value,
      visibleNodeTypes: Array.from(visibleNodeTypes.value),
      layoutDirection: layoutDirection.value,
      nodeSpacing: nodeSpacing.value,
      rankSpacing: rankSpacing.value,
      enabledRelationshipTypes: enabledRelationshipTypes.value,
      useMultiAlgorithm: useMultiAlgorithm.value,
      layoutStrategy: layoutStrategy.value,
      forceDirectedConfig: forceDirectedConfig.value,
      gridConfig: gridConfig.value,
      useSmartClustering: useSmartClustering.value,
      clusteringOptions: clusteringOptions.value,
      useVisualHierarchy: useVisualHierarchy.value,
      visualHierarchyConfig: visualHierarchyConfig.value,
    });
  }

  function isNodeTypeVisible(nodeType: DependencyKind): boolean {
    const visible = visibleNodeTypes.value.has(nodeType);
    logger.debug(`isNodeTypeVisible(${nodeType}): ${String(visible)}`);
    return visible;
  }

  function toggleNodeType(nodeType: DependencyKind): void {
    const currentVisibility = isNodeTypeVisible(nodeType);
    logger.debug(`toggleNodeType: ${nodeType} (current: ${String(currentVisibility)})`);
    setNodeTypeVisibility(nodeType, !currentVisibility);
  }

  function setLayoutDirection(value: 'LR' | 'RL' | 'TB' | 'BT'): void {
    logger.debug(`setLayoutDirection: ${layoutDirection.value} -> ${value}`);
    layoutDirection.value = value;
  }

  function setNodeSpacing(value: number): void {
    logger.debug(`setNodeSpacing: ${String(nodeSpacing.value)} -> ${String(value)}`);
    nodeSpacing.value = value;
  }

  function setRankSpacing(value: number): void {
    logger.debug(`setRankSpacing: ${String(rankSpacing.value)} -> ${String(value)}`);
    rankSpacing.value = value;
  }

  function setEnabledRelationshipTypes(types: string[]): void {
    logger.debug(
      `setEnabledRelationshipTypes: ${String(enabledRelationshipTypes.value.length)} -> ${String(types.length)} types`
    );
    enabledRelationshipTypes.value = types;
  }

  // Enhanced layout actions
  function setUseMultiAlgorithm(value: boolean): void {
    logger.debug(`setUseMultiAlgorithm: ${String(useMultiAlgorithm.value)} -> ${String(value)}`);
    useMultiAlgorithm.value = value;
  }

  function setLayoutStrategy(value: 'balanced' | 'performance' | 'detailed'): void {
    logger.debug(`setLayoutStrategy: ${layoutStrategy.value} -> ${value}`);
    layoutStrategy.value = value;
  }

  function setForceDirectedConfig(config: {
    iterations: number;
    strength: number;
    distance: number;
    damping: number;
  }): void {
    logger.debug('setForceDirectedConfig:', config);
    forceDirectedConfig.value = config;
  }

  function setGridConfig(config: { cellSize: number; padding: number }): void {
    logger.debug('setGridConfig:', config);
    gridConfig.value = config;
  }

  // Smart clustering actions
  function setUseSmartClustering(value: boolean): void {
    logger.debug(`setUseSmartClustering: ${String(useSmartClustering.value)} -> ${String(value)}`);
    useSmartClustering.value = value;
  }

  function setClusteringOptions(options: {
    dependencyBased: boolean;
    complexityBased: boolean;
    couplingBased: boolean;
    temporalBased: boolean;
    customMetrics: string[];
  }): void {
    logger.debug('setClusteringOptions:', options);
    clusteringOptions.value = options;
  }

  // Visual hierarchy actions
  function setUseVisualHierarchy(value: boolean): void {
    logger.debug(`setUseVisualHierarchy: ${String(useVisualHierarchy.value)} -> ${String(value)}`);
    useVisualHierarchy.value = value;
  }

  function setVisualHierarchyConfig(config: {
    sizeByComplexity: boolean;
    sizeByCoupling: boolean;
    sizeByImportance: boolean;
    colorByComplexity: boolean;
    colorByCoupling: boolean;
    colorByHealth: boolean;
    showComplexityBadge: boolean;
    showCouplingIndicator: boolean;
    showHealthIndicator: boolean;
    showImportanceGlow: boolean;
    sizeMultiplier: number;
    colorIntensity: number;
    indicatorSize: number;
  }): void {
    logger.debug('setVisualHierarchyConfig:', config);
    visualHierarchyConfig.value = config;
  }

  return {
    // View option refs
    showPackages,
    showClasses,
    clusterByFolder,
    visibleNodeTypes,
    // Layout configuration refs
    layoutDirection,
    nodeSpacing,
    rankSpacing,
    // Relationship filter refs
    enabledRelationshipTypes,
    // Enhanced layout refs
    useMultiAlgorithm,
    layoutStrategy,
    forceDirectedConfig,
    gridConfig,
    // Smart clustering refs
    useSmartClustering,
    clusteringOptions,
    // Visual hierarchy refs
    useVisualHierarchy,
    visualHierarchyConfig,
    // View actions
    setShowPackages,
    setShowClasses,
    setClusterByFolder,
    setNodeTypeVisibility,
    isNodeTypeVisible,
    toggleNodeType,
    // Layout actions
    setLayoutDirection,
    setNodeSpacing,
    setRankSpacing,
    // Relationship filter actions
    setEnabledRelationshipTypes,
    // Enhanced layout actions
    setUseMultiAlgorithm,
    setLayoutStrategy,
    setForceDirectedConfig,
    setGridConfig,
    // Smart clustering actions
    setUseSmartClustering,
    setClusteringOptions,
    // Visual hierarchy actions
    setUseVisualHierarchy,
    setVisualHierarchyConfig,
  };
});
