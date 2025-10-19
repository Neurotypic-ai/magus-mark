import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { DependencyKind } from '../components/DependencyGraph/types';

export const useGraphSettings = defineStore('graphSettings', () => {
  // View options - what level of detail to show
  const showPackages = ref<boolean>(false); // Start with packages hidden for cleaner view
  const showClasses = ref<boolean>(false); // Start with class details hidden, showing only modules

  // Clustering options
  const collapseScc = ref<boolean>(false); // Changed default to false since user doesn't have cycles
  const clusterByFolder = ref<boolean>(false);

  // Symbol type visibility settings - only applies when showClasses is true
  // All symbol types visible by default
  const visibleNodeTypes = ref<Set<DependencyKind>>(
    new Set(['class', 'interface', 'enum', 'type', 'function'])
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
