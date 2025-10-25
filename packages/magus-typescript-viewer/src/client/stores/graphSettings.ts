import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { createLogger } from '../../shared/utils/logger';

import type { DependencyKind } from '../components/DependencyGraph/types';

const logger = createLogger('graphSettings');
const STORAGE_KEY = 'magus-graph-settings';

// Granular type definitions for better maintainability
export type LayoutDirection = 'LR' | 'RL' | 'TB' | 'BT';
export type LayoutStrategy = 'balanced' | 'performance' | 'detailed';

// Utility types for better type safety
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export interface ViewOptions {
  showPackages: boolean;
  showModules: boolean;
  showClasses: boolean;
  showInterfaces: boolean;
  showTypes: boolean;
  showEnums: boolean;
  showFunctions: boolean;
}

export interface ClusteringOptions {
  clusterByFolder: boolean;
  useSmartClustering: boolean;
  clusteringOptions: {
    dependencyBased: boolean;
    complexityBased: boolean;
    couplingBased: boolean;
    temporalBased: boolean;
    customMetrics: string[];
  };
}

export interface LayoutConfig {
  layoutDirection: LayoutDirection;
  nodeSpacing: number;
  rankSpacing: number;
  useMultiAlgorithm: boolean;
  layoutStrategy: LayoutStrategy;
}

export interface ForceDirectedConfig {
  iterations: number;
  strength: number;
  distance: number;
  damping: number;
}

export interface GridConfig {
  cellSize: number;
  padding: number;
}

export interface VisualHierarchyConfig {
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
}

export interface VisualHierarchyOptions {
  useVisualHierarchy: boolean;
  visualHierarchyConfig: VisualHierarchyConfig;
}

// Main settings interface composed of granular types
interface PersistedSettings extends ViewOptions, ClusteringOptions, LayoutConfig, VisualHierarchyOptions {
  visibleNodeTypes: string[];
  enabledRelationshipTypes: string[];
  forceDirectedConfig: ForceDirectedConfig;
  gridConfig: GridConfig;
}

// Default settings factory
function createDefaultSettings(): PersistedSettings {
  return {
    // View options - enable modules and symbol types by default for better UX
    showPackages: false,
    showModules: true,
    showClasses: true,
    showInterfaces: true,
    showTypes: false,
    showEnums: false,
    showFunctions: false,

    // Clustering options
    clusterByFolder: false,
    useSmartClustering: false,
    clusteringOptions: {
      dependencyBased: true,
      complexityBased: true,
      couplingBased: true,
      temporalBased: false,
      customMetrics: [],
    },

    // Layout configuration
    layoutDirection: 'LR',
    nodeSpacing: 150,
    rankSpacing: 250,
    useMultiAlgorithm: false,
    layoutStrategy: 'balanced',

    // Visual hierarchy options
    useVisualHierarchy: false,
    visualHierarchyConfig: {
      sizeByComplexity: true,
      sizeByCoupling: false,
      sizeByImportance: true,
      colorByComplexity: true,
      colorByCoupling: false,
      colorByHealth: true,
      showComplexityBadge: true,
      showCouplingIndicator: true,
      showHealthIndicator: true,
      showImportanceGlow: true,
      sizeMultiplier: 1.0,
      colorIntensity: 0.7,
      indicatorSize: 12,
    },

    // Additional settings
    visibleNodeTypes: ['class', 'interface', 'enum', 'type', 'function'],
    enabledRelationshipTypes: [
      'import',
      'export',
      'inheritance',
      'implements',
      'contains',
      'dependency',
      'devDependency',
      'peerDependency',
    ],
    forceDirectedConfig: {
      iterations: 100,
      strength: 0.1,
      distance: 200,
      damping: 0.8,
    },
    gridConfig: {
      cellSize: 300,
      padding: 50,
    },
  };
}

// Helper functions for validating granular types
function isValidLayoutDirection(value: unknown): value is LayoutDirection {
  return value === 'LR' || value === 'RL' || value === 'TB' || value === 'BT';
}

function isValidLayoutStrategy(value: unknown): value is LayoutStrategy {
  return value === 'balanced' || value === 'performance' || value === 'detailed';
}

function isValidViewOptions(obj: Record<string, unknown>): boolean {
  return (
    typeof obj['showPackages'] === 'boolean' &&
    (obj['showModules'] === undefined || typeof obj['showModules'] === 'boolean') &&
    typeof obj['showClasses'] === 'boolean' &&
    (obj['showInterfaces'] === undefined || typeof obj['showInterfaces'] === 'boolean') &&
    (obj['showTypes'] === undefined || typeof obj['showTypes'] === 'boolean') &&
    (obj['showEnums'] === undefined || typeof obj['showEnums'] === 'boolean') &&
    (obj['showFunctions'] === undefined || typeof obj['showFunctions'] === 'boolean')
  );
}

function isValidClusteringOptions(obj: Record<string, unknown>): boolean {
  return (
    typeof obj['clusterByFolder'] === 'boolean' &&
    (obj['useSmartClustering'] === undefined || typeof obj['useSmartClustering'] === 'boolean') &&
    (obj['clusteringOptions'] === undefined || typeof obj['clusteringOptions'] === 'object')
  );
}

function isValidLayoutConfig(obj: Record<string, unknown>): boolean {
  return (
    (obj['layoutDirection'] === undefined || isValidLayoutDirection(obj['layoutDirection'])) &&
    (obj['nodeSpacing'] === undefined || typeof obj['nodeSpacing'] === 'number') &&
    (obj['rankSpacing'] === undefined || typeof obj['rankSpacing'] === 'number') &&
    (obj['useMultiAlgorithm'] === undefined || typeof obj['useMultiAlgorithm'] === 'boolean') &&
    (obj['layoutStrategy'] === undefined || isValidLayoutStrategy(obj['layoutStrategy']))
  );
}

function isValidVisualHierarchyOptions(obj: Record<string, unknown>): boolean {
  return (
    (obj['useVisualHierarchy'] === undefined || typeof obj['useVisualHierarchy'] === 'boolean') &&
    (obj['visualHierarchyConfig'] === undefined || typeof obj['visualHierarchyConfig'] === 'object')
  );
}

function isPersistedSettings(value: unknown): value is PersistedSettings {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;

  return (
    isValidViewOptions(obj) &&
    isValidClusteringOptions(obj) &&
    isValidLayoutConfig(obj) &&
    isValidVisualHierarchyOptions(obj) &&
    Array.isArray(obj['visibleNodeTypes']) &&
    obj['visibleNodeTypes'].every((item) => typeof item === 'string') &&
    (obj['enabledRelationshipTypes'] === undefined ||
      (Array.isArray(obj['enabledRelationshipTypes']) &&
        obj['enabledRelationshipTypes'].every((item) => typeof item === 'string'))) &&
    (obj['forceDirectedConfig'] === undefined || typeof obj['forceDirectedConfig'] === 'object') &&
    (obj['gridConfig'] === undefined || typeof obj['gridConfig'] === 'object')
  );
}

// Load settings from localStorage with defaults
function loadSettings(): PersistedSettings {
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

  // Always return defaults if loading fails
  const defaults = createDefaultSettings();
  logger.debug('Using default settings:', defaults);
  return defaults;
}

// Save settings to localStorage
function saveSettings(settings: PersistedSettings) {
  logger.debug('Saving settings to localStorage:', settings);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    logger.debug('Settings saved successfully');
  } catch (error) {
    logger.error('Failed to save graph settings to localStorage', error);
  }
}

// Helper function to create settings object from store state
function createSettingsFromState(state: {
  showPackages: boolean;
  showModules: boolean;
  showClasses: boolean;
  showInterfaces: boolean;
  showTypes: boolean;
  showEnums: boolean;
  showFunctions: boolean;
  clusterByFolder: boolean;
  visibleNodeTypes: Set<DependencyKind>;
  layoutDirection: LayoutDirection;
  nodeSpacing: number;
  rankSpacing: number;
  enabledRelationshipTypes: string[];
  useMultiAlgorithm: boolean;
  layoutStrategy: LayoutStrategy;
  forceDirectedConfig: ForceDirectedConfig;
  gridConfig: GridConfig;
  useSmartClustering: boolean;
  clusteringOptions: ClusteringOptions['clusteringOptions'];
  useVisualHierarchy: boolean;
  visualHierarchyConfig: VisualHierarchyConfig;
}): PersistedSettings {
  return {
    showPackages: state.showPackages,
    showModules: state.showModules,
    showClasses: state.showClasses,
    showInterfaces: state.showInterfaces,
    showTypes: state.showTypes,
    showEnums: state.showEnums,
    showFunctions: state.showFunctions,
    clusterByFolder: state.clusterByFolder,
    visibleNodeTypes: Array.from(state.visibleNodeTypes),
    layoutDirection: state.layoutDirection,
    nodeSpacing: state.nodeSpacing,
    rankSpacing: state.rankSpacing,
    enabledRelationshipTypes: state.enabledRelationshipTypes,
    useMultiAlgorithm: state.useMultiAlgorithm,
    layoutStrategy: state.layoutStrategy,
    forceDirectedConfig: state.forceDirectedConfig,
    gridConfig: state.gridConfig,
    useSmartClustering: state.useSmartClustering,
    clusteringOptions: state.clusteringOptions,
    useVisualHierarchy: state.useVisualHierarchy,
    visualHierarchyConfig: state.visualHierarchyConfig,
  };
}

export const useGraphSettings = defineStore('graphSettings', () => {
  logger.info('Initializing graph settings store');
  // Load persisted settings (always returns defaults if loading fails)
  const persisted = loadSettings();

  // Initialize all reactive refs from persisted settings
  const showPackages = ref<boolean>(persisted.showPackages);
  const showModules = ref<boolean>(persisted.showModules);
  const showClasses = ref<boolean>(persisted.showClasses);
  const showInterfaces = ref<boolean>(persisted.showInterfaces);
  const showTypes = ref<boolean>(persisted.showTypes);
  const showEnums = ref<boolean>(persisted.showEnums);
  const showFunctions = ref<boolean>(persisted.showFunctions);

  const clusterByFolder = ref<boolean>(persisted.clusterByFolder);

  // Initialize visibleNodeTypes from boolean flags to ensure consistency
  const initialVisibleTypes = new Set<DependencyKind>();
  if (persisted.showPackages) initialVisibleTypes.add('package');
  if (persisted.showModules) initialVisibleTypes.add('module');
  if (persisted.showClasses) initialVisibleTypes.add('class');
  if (persisted.showInterfaces) initialVisibleTypes.add('interface');
  if (persisted.showTypes) initialVisibleTypes.add('type');
  if (persisted.showEnums) initialVisibleTypes.add('enum');
  if (persisted.showFunctions) initialVisibleTypes.add('function');

  const visibleNodeTypes = ref<Set<DependencyKind>>(initialVisibleTypes);

  const layoutDirection = ref<LayoutDirection>(persisted.layoutDirection);
  const nodeSpacing = ref<number>(persisted.nodeSpacing);
  const rankSpacing = ref<number>(persisted.rankSpacing);
  const enabledRelationshipTypes = ref<string[]>(persisted.enabledRelationshipTypes);

  const useMultiAlgorithm = ref<boolean>(persisted.useMultiAlgorithm);
  const layoutStrategy = ref<LayoutStrategy>(persisted.layoutStrategy);
  const forceDirectedConfig = ref<ForceDirectedConfig>(persisted.forceDirectedConfig);
  const gridConfig = ref<GridConfig>(persisted.gridConfig);

  const useSmartClustering = ref<boolean>(persisted.useSmartClustering);
  const clusteringOptions = ref<ClusteringOptions['clusteringOptions']>(persisted.clusteringOptions);

  const useVisualHierarchy = ref<boolean>(persisted.useVisualHierarchy);
  const visualHierarchyConfig = ref<VisualHierarchyConfig>(persisted.visualHierarchyConfig);

  logger.debug('Initialized settings from persisted data:', {
    showPackages: showPackages.value,
    showModules: showModules.value,
    showClasses: showClasses.value,
    clusterByFolder: clusterByFolder.value,
    layoutDirection: layoutDirection.value,
    useMultiAlgorithm: useMultiAlgorithm.value,
    useSmartClustering: useSmartClustering.value,
    useVisualHierarchy: useVisualHierarchy.value,
  });

  // Auto-sync boolean flags to visibleNodeTypes Set
  // This keeps the two visibility systems in sync
  watch(showPackages, (value) => {
    if (value) {
      visibleNodeTypes.value.add('package');
    } else {
      visibleNodeTypes.value.delete('package');
    }
    visibleNodeTypes.value = new Set(visibleNodeTypes.value); // Trigger reactivity
  });

  watch(showModules, (value) => {
    if (value) {
      visibleNodeTypes.value.add('module');
    } else {
      visibleNodeTypes.value.delete('module');
    }
    visibleNodeTypes.value = new Set(visibleNodeTypes.value); // Trigger reactivity
  });

  watch(showClasses, (value) => {
    if (value) {
      visibleNodeTypes.value.add('class');
    } else {
      visibleNodeTypes.value.delete('class');
    }
    visibleNodeTypes.value = new Set(visibleNodeTypes.value); // Trigger reactivity
  });

  watch(showInterfaces, (value) => {
    if (value) {
      visibleNodeTypes.value.add('interface');
    } else {
      visibleNodeTypes.value.delete('interface');
    }
    visibleNodeTypes.value = new Set(visibleNodeTypes.value); // Trigger reactivity
  });

  watch(showTypes, (value) => {
    if (value) {
      visibleNodeTypes.value.add('type');
    } else {
      visibleNodeTypes.value.delete('type');
    }
    visibleNodeTypes.value = new Set(visibleNodeTypes.value); // Trigger reactivity
  });

  watch(showEnums, (value) => {
    if (value) {
      visibleNodeTypes.value.add('enum');
    } else {
      visibleNodeTypes.value.delete('enum');
    }
    visibleNodeTypes.value = new Set(visibleNodeTypes.value); // Trigger reactivity
  });

  watch(showFunctions, (value) => {
    if (value) {
      visibleNodeTypes.value.add('function');
    } else {
      visibleNodeTypes.value.delete('function');
    }
    visibleNodeTypes.value = new Set(visibleNodeTypes.value); // Trigger reactivity
  });

  // Watch for changes and persist to localStorage
  watch(
    [
      showPackages,
      showModules,
      showClasses,
      showInterfaces,
      showTypes,
      showEnums,
      showFunctions,
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
      const settings = createSettingsFromState({
        showPackages: showPackages.value,
        showModules: showModules.value,
        showClasses: showClasses.value,
        showInterfaces: showInterfaces.value,
        showTypes: showTypes.value,
        showEnums: showEnums.value,
        showFunctions: showFunctions.value,
        clusterByFolder: clusterByFolder.value,
        visibleNodeTypes: visibleNodeTypes.value,
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
      saveSettings(settings);
    },
    { deep: true }
  );

  function setShowPackages(value: boolean): void {
    logger.debug(`setShowPackages: ${String(showPackages.value)} -> ${String(value)}`);
    showPackages.value = value;
  }

  function setShowModules(value: boolean): void {
    logger.debug(`setShowModules: ${String(showModules.value)} -> ${String(value)}`);
    showModules.value = value;
  }

  function setShowClasses(value: boolean): void {
    logger.debug(`setShowClasses: ${String(showClasses.value)} -> ${String(value)}`);
    showClasses.value = value;
  }

  function setShowInterfaces(value: boolean): void {
    logger.debug(`setShowInterfaces: ${String(showInterfaces.value)} -> ${String(value)}`);
    showInterfaces.value = value;
  }

  function setShowTypes(value: boolean): void {
    logger.debug(`setShowTypes: ${String(showTypes.value)} -> ${String(value)}`);
    showTypes.value = value;
  }

  function setShowEnums(value: boolean): void {
    logger.debug(`setShowEnums: ${String(showEnums.value)} -> ${String(value)}`);
    showEnums.value = value;
  }

  function setShowFunctions(value: boolean): void {
    logger.debug(`setShowFunctions: ${String(showFunctions.value)} -> ${String(value)}`);
    showFunctions.value = value;
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
    const settings = createSettingsFromState({
      showPackages: showPackages.value,
      showModules: showModules.value,
      showClasses: showClasses.value,
      showInterfaces: showInterfaces.value,
      showTypes: showTypes.value,
      showEnums: showEnums.value,
      showFunctions: showFunctions.value,
      clusterByFolder: clusterByFolder.value,
      visibleNodeTypes: visibleNodeTypes.value,
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
    saveSettings(settings);
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
    showModules,
    showClasses,
    showInterfaces,
    showTypes,
    showEnums,
    showFunctions,
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
    setShowModules,
    setShowClasses,
    setShowInterfaces,
    setShowTypes,
    setShowEnums,
    setShowFunctions,
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
