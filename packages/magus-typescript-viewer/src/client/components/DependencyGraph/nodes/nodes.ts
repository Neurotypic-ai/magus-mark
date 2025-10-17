import { markRaw } from 'vue';

import DependencyNode from './DependencyNode.vue';

import type { Component } from 'vue';

import type { DependencyKind } from '../types';

/**
 * Custom node types for the VueFlow dependency graph
 * Each key maps to a DependencyKind value
 * Components are marked as raw to prevent Vue from making them reactive,
 * which avoids unnecessary performance overhead
 */
const nodeTypeKeys: DependencyKind[] = [
  'package',
  'module',
  'class',
  'interface',
  'enum',
  'type',
  'function',
  'group',
  'property',
  'method',
];

// Create the nodeTypes object with properly typed keys and components
// markRaw prevents Vue from making component definitions reactive
export const nodeTypes: Record<string, Component> = Object.fromEntries(
  nodeTypeKeys.map((key) => [key, markRaw(DependencyNode)])
);
