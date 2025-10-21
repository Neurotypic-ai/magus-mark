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
  type: DependencyKind;
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
 * Edge data structure for relationships
 */
export interface EdgeData {
  type: DependencyEdgeKind;
  label?: string;
  [key: string]: unknown;
}

/**
 * Cytoscape node data with type information
 */
export interface CytoscapeNodeData extends DependencyData {
  id: string;
  parent?: string;
}

/**
 * Cytoscape edge data with type information
 */
export interface CytoscapeEdgeData extends EdgeData {
  id: string;
  source: string;
  target: string;
}

/**
 * Dependency node type for Cytoscape
 */
export interface DependencyNode {
  group: 'nodes';
  data: CytoscapeNodeData;
  position?: { x: number; y: number };
  selected?: boolean;
  selectable?: boolean;
  locked?: boolean;
  grabbable?: boolean;
  classes?: string;
}

/**
 * Graph edge type for Cytoscape
 */
export interface GraphEdge {
  group: 'edges';
  data: CytoscapeEdgeData;
  selected?: boolean;
  selectable?: boolean;
  classes?: string;
}

/**
 * Props for dependency node components
 */
export interface DependencyProps {
  id: string;
  type: DependencyKind;
  data: DependencyData;
  selected?: boolean;
}

/**
 * Unified graph structure
 */
export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: GraphEdge[];
}

/**
 * Dependency structure for a package
 */
export interface DependencyRef {
  id: string;
  name?: string;
  version?: string;
}

/**
 * Import structure
 */
export interface ImportRef {
  uuid: string;
  name?: string;
  path?: string;
}

/**
 * Interface reference structure
 */
export interface InterfaceRef {
  id: string;
  name?: string;
}

/**
 * Module structure
 */
export interface ModuleStructure {
  id: string;
  name: string;
  package_id: string;
  source: {
    relativePath: string;
    [key: string]: unknown;
  };
  imports?: Record<string, ImportRef>;
  classes?: Record<string, ClassStructure>;
  interfaces?: Record<string, InterfaceStructure>;
  [key: string]: unknown;
}

/**
 * Class structure
 */
export interface ClassStructure {
  id: string;
  name: string;
  extends_id?: string;
  implemented_interfaces?: Record<string, InterfaceRef>;
  methods?: NodeMethod[];
  properties?: NodeProperty[];
  [key: string]: unknown;
}

/**
 * Interface structure
 */
export interface InterfaceStructure {
  id: string;
  name: string;
  extended_interfaces?: Record<string, InterfaceRef>;
  methods?: NodeMethod[];
  properties?: NodeProperty[];
  [key: string]: unknown;
}

/**
 * Package structure for graph visualization
 */
export interface PackageStructure {
  id: string;
  name: string;
  version: string;
  path: string;
  created_at: string;
  dependencies?: Record<string, DependencyRef>;
  devDependencies?: Record<string, DependencyRef>;
  peerDependencies?: Record<string, DependencyRef>;
  modules?: Record<string, ModuleStructure>;
  [key: string]: unknown;
}

/**
 * Package graph structure
 */
export interface DependencyPackageGraph {
  packages: PackageStructure[];
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
  direction: 'DOWN' | 'RIGHT' | 'LEFT' | 'UP';
  nodeSpacing: number;
  layerSpacing: number;
  hierarchical: boolean;
  algorithm: 'layered' | 'force' | 'stress' | 'mrtree';
}

/**
 * Search results for the graph search component
 */
export interface SearchResult {
  nodes: DependencyNode[];
  edges: GraphEdge[];
  path?: DependencyNode[];
}

/**
 * Type guard to check if an element is a node
 */
export function isNode(element: DependencyNode | GraphEdge): element is DependencyNode {
  return element.group === 'nodes';
}

/**
 * Type guard to check if an element is an edge
 */
export function isEdge(element: DependencyNode | GraphEdge): element is GraphEdge {
  return element.group === 'edges';
}

/**
 * Helper to convert Vue Flow style position to ELK direction
 */
export function toElkDirection(direction: string): 'DOWN' | 'RIGHT' | 'LEFT' | 'UP' {
  switch (direction) {
    case 'TB':
      return 'DOWN';
    case 'BT':
      return 'UP';
    case 'LR':
      return 'RIGHT';
    case 'RL':
      return 'LEFT';
    default:
      return 'RIGHT';
  }
}

/**
 * Helper to convert ELK direction to readable string
 */
export function fromElkDirection(direction: 'DOWN' | 'RIGHT' | 'LEFT' | 'UP'): 'LR' | 'RL' | 'TB' | 'BT' {
  switch (direction) {
    case 'DOWN':
      return 'TB';
    case 'UP':
      return 'BT';
    case 'RIGHT':
      return 'LR';
    case 'LEFT':
      return 'RL';
  }
}
