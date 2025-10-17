import type { Component } from 'vue';

import DependencyNode from './DependencyNode.vue';

import type { DependencyKind } from '../types';

/**
 * Custom node types for the VueFlow dependency graph
 * Each key maps to a DependencyKind value
 */
const nodeTypeKeys: DependencyKind[] = ['package', 'module', 'class', 'interface', 'enum', 'type', 'function', 'group'];

// Create the nodeTypes object with properly typed keys and components
export const nodeTypes: Record<string, Component> = Object.fromEntries(
  nodeTypeKeys.map((key) => [key, DependencyNode])
);
