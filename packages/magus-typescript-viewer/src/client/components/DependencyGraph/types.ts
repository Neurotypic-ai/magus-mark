import type { Edge, Node, Position } from '@vue-flow/core';

import type { Class } from '../../../shared/types/Class';
import type { Enum } from '../../../shared/types/Enum';
import type { Interface } from '../../../shared/types/Interface';
import type { Module } from '../../../shared/types/Module';
import type { Package } from '../../../shared/types/Package';
import type { TypeAlias } from '../../../shared/types/TypeAlias';

/**
 * Dependency kinds (node types)
 */
export type DependencyKind =
  | 'package'
  | 'module'
  | 'class'
  | 'interface'
  | 'enum'
  | 'type'
  | 'function'
  | 'group'
  | 'property'
  | 'method';

/**
 * Edge types for dependency relationships
 */
export type DependencyEdgeKind =
  | 'dependency'
  | 'devDependency'
  | 'peerDependency'
  | 'import'
  | 'uses'
  | 'export'
  | 'inheritance'
  | 'implements'
  | 'extends'
  | 'contains';

/**
 * Node method format for display
 */
export interface NodeMethod {
  name: string;
  returnType: string;
  visibility: string;
  signature: string;
}

/**
 * Node property format for display
 */
export interface NodeProperty {
  name: string;
  type: string;
  visibility: string;
}

/**
 * Node data structure for dependency nodes
 */
export interface DependencyData {
  label: string;
  parentId?: string;
  methods?: NodeMethod[];
  properties?: NodeProperty[];
  implements?: string[];
  extends?: string[];
  imports?: string[];
  exports?: string[];
  [key: string]: unknown;
}

/**
 * Dependency node type extending ReactFlow's Node
 */
export type DependencyNode = Node<DependencyData>;

/**
 * Props for dependency node components - adapted to work with XYFlow's requirements
 */
export interface DependencyProps {
  id: string;
  type: DependencyKind;
  data: DependencyData;
  selected?: boolean;
  sourcePosition?: Position;
  targetPosition?: Position;
}

/**
 * Graph edge extending ReactFlow's Edge
 */
export type GraphEdge = Edge<{
  type?: DependencyEdgeKind;
}>;

/**
 * Unified graph structure
 */
export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: GraphEdge[];
}

/**
 * Normalized graph structure with flat Maps for all entity types
 */
export interface DependencyPackageGraph {
  packages: Map<string, Package>;
  modules: Map<string, Module>;
  classes: Map<string, Class>;
  interfaces: Map<string, Interface>;
  types: Map<string, TypeAlias>;
  enums: Map<string, Enum>;
}

/**
 * Layout configuration
 */
// Note: Layout configuration types live in layout/config.ts and layout/dagreLayoutEngine.ts.

/**
 * Search results for the graph search component
 */
export interface SearchResult {
  nodes: DependencyNode[];
  edges: GraphEdge[];
  path?: DependencyNode[];
}
