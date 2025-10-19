import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import type { DependencyKind } from '../components/DependencyGraph/types';

const STORAGE_KEY = 'magus-graph-settings';

// Load settings from localStorage
function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load graph settings from localStorage:', error);
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save graph settings to localStorage:', error);
  }
}

export const useGraphSettings = defineStore('graphSettings', () => {
  // Load persisted settings
  const persisted = loadSettings();

  // View options - what level of detail to show
  const showPackages = ref<boolean>(persisted?.showPackages ?? false);
  const showClasses = ref<boolean>(persisted?.showClasses ?? false);

  // Clustering options
  const collapseScc = ref<boolean>(persisted?.collapseScc ?? false);
  const clusterByFolder = ref<boolean>(persisted?.clusterByFolder ?? false);

  // Symbol type visibility settings - only applies when showClasses is true
  // All symbol types visible by default
  const visibleNodeTypes = ref<Set<DependencyKind>>(
    new Set(persisted?.visibleNodeTypes ?? ['class', 'interface', 'enum', 'type', 'function'])
  );

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
    showPackages.value = value;
  }

  function setShowClasses(value: boolean): void {
    showClasses.value = value;
  }

  function setCollapseScc(value: boolean): void {
    collapseScc.value = value;
  }

  function setClusterByFolder(value: boolean): void {
    clusterByFolder.value = value;
  }

  function setNodeTypeVisibility(nodeType: DependencyKind, visible: boolean): void {
    if (visible) {
      visibleNodeTypes.value.add(nodeType);
    } else {
      visibleNodeTypes.value.delete(nodeType);
    }
    // Trigger reactivity by creating new Set
    visibleNodeTypes.value = new Set(visibleNodeTypes.value);
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
    return visibleNodeTypes.value.has(nodeType);
  }

  function toggleNodeType(nodeType: DependencyKind): void {
    setNodeTypeVisibility(nodeType, !isNodeTypeVisible(nodeType));
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
