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
        obj['enabledRelationshipTypes'].every((item) => typeof item === 'string')))
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
  };
});
