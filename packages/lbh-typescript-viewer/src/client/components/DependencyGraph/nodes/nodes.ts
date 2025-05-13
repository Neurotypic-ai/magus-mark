import DependencyNode from './DependencyNode';

import type { NodeTypes } from '@xyflow/react';

import type { DependencyKind } from '../types';

/**
 * Custom node types for the ReactFlow dependency graph
 * Each key maps to a DependencyKind value
 */
const nodeTypeKeys: DependencyKind[] = ['package', 'module', 'class', 'interface', 'enum', 'type', 'function', 'group'];

// Create the nodeTypes object with properly typed keys and components
export const nodeTypes: NodeTypes = Object.fromEntries(nodeTypeKeys.map((key) => [key, DependencyNode])) as NodeTypes;
