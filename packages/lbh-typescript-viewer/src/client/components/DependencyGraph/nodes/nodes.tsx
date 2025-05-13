import DependencyNode from './DependencyNode';

import type { DependencyProps } from '../types';

export function PackageNode(props: DependencyProps) {
  return <DependencyNode {...props} />;
}

export function ModuleNode(props: DependencyProps) {
  return <DependencyNode {...props} />;
}

export function ClassNode(props: DependencyProps) {
  return <DependencyNode {...props} />;
}

export function InterfaceNode(props: DependencyProps) {
  return <DependencyNode {...props} />;
}

export function GroupNode(props: DependencyProps) {
  return <DependencyNode {...props} />;
}

// Export a map of node types to their components
export const nodeTypes = {
  package: PackageNode,
  module: ModuleNode,
  class: ClassNode,
  interface: InterfaceNode,
  group: GroupNode,
} as const;
