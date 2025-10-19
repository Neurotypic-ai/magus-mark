import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { createLogger } from '../../shared/utils/logger';

import type { DependencyKind } from '../components/DependencyGraph/types';

const logger = createLogger('graphSettings');
const STORAGE_KEY = 'magus-graph-settings';

interface PersistedSettings {
  showPackages: boolean;
  showClasses: boolean;
  collapseScc: boolean;
  clusterByFolder: boolean;
  visibleNodeTypes: string[];
}

function isPersistedSettings(value: unknown): value is PersistedSettings {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['showPackages'] === 'boolean' &&
    typeof obj['showClasses'] === 'boolean' &&
    typeof obj['collapseScc'] === 'boolean' &&
    typeof obj['clusterByFolder'] === 'boolean' &&
    Array.isArray(obj['visibleNodeTypes']) &&
    obj['visibleNodeTypes'].every((item) => typeof item === 'string')
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
  collapseScc: boolean;
  clusterByFolder: boolean;
  visibleNodeTypes: string[];
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
  const collapseScc = ref<boolean>(persisted?.collapseScc ?? false);
  const clusterByFolder = ref<boolean>(persisted?.clusterByFolder ?? false);
  logger.debug(
    `Initial clustering - collapseScc: ${String(collapseScc.value)}, clusterByFolder: ${String(clusterByFolder.value)}`
  );

  // Symbol type visibility settings - only applies when showClasses is true
  // All symbol types visible by default
  const defaultNodeTypes: DependencyKind[] = ['class', 'interface', 'enum', 'type', 'function'];
  const visibleNodeTypes = ref<Set<DependencyKind>>(
    new Set<DependencyKind>(persisted ? (persisted.visibleNodeTypes as DependencyKind[]) : defaultNodeTypes)
  );
  logger.debug('Initial visible node types:', Array.from(visibleNodeTypes.value));

  // Watch for changes and persist to localStorage
  watch(
    [showPackages, showClasses, collapseScc, clusterByFolder, visibleNodeTypes],
    () => {
      saveSettings({
        showPackages: showPackages.value,
        showClasses: showClasses.value,
        collapseScc: collapseScc.value,
        clusterByFolder: clusterByFolder.value,
        visibleNodeTypes: Array.from(visibleNodeTypes.value),
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

  function setCollapseScc(value: boolean): void {
    logger.debug(`setCollapseScc: ${String(collapseScc.value)} -> ${String(value)}`);
    collapseScc.value = value;
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
      collapseScc: collapseScc.value,
      clusterByFolder: clusterByFolder.value,
      visibleNodeTypes: Array.from(visibleNodeTypes.value),
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

  return {
    // Return refs, not values
    showPackages,
    showClasses,
    collapseScc,
    clusterByFolder,
    visibleNodeTypes,
    // Actions
    setShowPackages,
    setShowClasses,
    setCollapseScc,
    setClusterByFolder,
    setNodeTypeVisibility,
    isNodeTypeVisible,
    toggleNodeType,
  };
});
