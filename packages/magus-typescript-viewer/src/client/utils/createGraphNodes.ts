import { Position } from '@vue-flow/core';

import { mapTypeCollection } from '../components/DependencyGraph/mapTypeCollection';
import { getNodeStyle } from '../theme/graphTheme';

import type {
  ClassStructure,
  DependencyKind,
  DependencyNode,
  DependencyPackageGraph,
  InterfaceStructure,
  ModuleStructure,
  NodeMethod,
  NodeProperty,
  PackageStructure,
} from '../components/DependencyGraph/types';

/**
 * Configuration for handle positions based on layout direction
 */
interface HandlePositions {
  sourcePosition: Position;
  targetPosition: Position;
}

/**
 * Options for creating graph nodes
 */
interface CreateGraphNodesOptions {
  includePackages?: boolean;
  includeClasses?: boolean;
  direction?: 'LR' | 'RL' | 'TB' | 'BT';
  visibleNodeTypes?: Set<DependencyKind>;
}

/**
 * Calculates handle positions based on layout direction
 * @param direction The layout direction
 * @returns Object containing source and target positions
 */
function calculateHandlePositions(direction: 'LR' | 'RL' | 'TB' | 'BT'): HandlePositions {
  switch (direction) {
    case 'LR':
      return { sourcePosition: Position.Right, targetPosition: Position.Left };
    case 'RL':
      return { sourcePosition: Position.Left, targetPosition: Position.Right };
    case 'TB':
      return { sourcePosition: Position.Bottom, targetPosition: Position.Top };
    case 'BT':
      return { sourcePosition: Position.Top, targetPosition: Position.Bottom };
  }
}

/**
 * Checks if a node type should be included based on visibility filters
 * Note: visibleNodeTypes only applies to symbol types (class, interface, etc.)
 * Structural types (package, module, group) are controlled by includePackages/includeClasses
 * @param nodeType The type of node to check
 * @param visibleNodeTypes Optional set of visible node types
 * @returns True if the node type should be included
 */
function shouldIncludeNodeType(nodeType: DependencyKind, visibleNodeTypes?: Set<DependencyKind>): boolean {
  if (!visibleNodeTypes) return true;
  // For structural types, always return true (they're controlled by other flags)
  if (nodeType === 'package' || nodeType === 'module' || nodeType === 'group') return true;
  return visibleNodeTypes.has(nodeType);
}

/**
 * Estimates node dimensions based on type and content
 * These estimates help the layout algorithm produce better initial layouts
 * @param nodeType The type of node
 * @param data The node data (for counting properties/methods)
 * @returns Estimated width and height in pixels
 */
function estimateNodeDimensions(
  nodeType: DependencyKind,
  data?: { properties?: NodeProperty[]; methods?: NodeMethod[] }
): { width: number; height: number } {
  switch (nodeType) {
    case 'package':
      return { width: 300, height: 150 };
    case 'module':
      return { width: 250, height: 100 };
    case 'group':
      return { width: 400, height: 300 };
    case 'class':
    case 'interface': {
      // Base dimensions
      const baseWidth = 220;
      const baseHeight = 60;

      // Add height for properties and methods
      const propertyCount = data?.properties?.length ?? 0;
      const methodCount = data?.methods?.length ?? 0;
      const itemHeight = 24; // Height per property/method row

      return {
        width: baseWidth,
        height: baseHeight + (propertyCount + methodCount) * itemHeight,
      };
    }
    default:
      return { width: 180, height: 80 };
  }
}

/**
 * Converts properties from a class or interface structure to node properties
 * @param properties The raw properties object
 * @returns Array of formatted node properties
 */
function convertPropertiesToNodeProperties(
  properties: Record<string, { name: string; type: string; visibility: string }> | NodeProperty[] | undefined
): NodeProperty[] {
  if (!properties) return [];
  return mapTypeCollection(properties, (prop) => ({
    name: prop.name,
    type: prop.type,
    visibility: prop.visibility,
  }));
}

/**
 * Converts methods from a class or interface structure to node methods
 * @param methods The raw methods object
 * @returns Array of formatted node methods
 */
function convertMethodsToNodeMethods(
  methods: Record<string, { name: string; returnType?: string; visibility: string }> | NodeMethod[] | undefined
): NodeMethod[] {
  if (!methods) return [];
  return mapTypeCollection(methods, (method) => {
    const returnType = method.returnType ?? 'void';
    const methodName = method.name;
    const visibility = method.visibility;
    return {
      name: methodName,
      returnType,
      visibility,
      signature: `${methodName}(): ${returnType}`,
    };
  });
}

/**
 * Creates a package node
 * @param pkg The package structure
 * @param positions Handle positions for the node
 * @returns A dependency node representing the package
 */
function createPackageNode(pkg: PackageStructure, positions: HandlePositions): DependencyNode {
  const dimensions = estimateNodeDimensions('package');

  return {
    id: pkg.id,
    type: 'package' as DependencyKind,
    position: { x: 0, y: 0 },
    sourcePosition: positions.sourcePosition,
    targetPosition: positions.targetPosition,
    expandParent: true,
    width: dimensions.width,
    height: dimensions.height,
    data: {
      label: pkg.name,
      properties: [{ name: 'version', type: pkg.version, visibility: 'public' }],
    },
    style: {
      ...getNodeStyle('package'),
      width: dimensions.width,
      height: dimensions.height,
    },
  };
}

/**
 * Creates a module node
 * @param module The module structure
 * @param pkg The parent package
 * @param positions Handle positions for the node
 * @param includePackages Whether to include package parent relationships
 * @returns A dependency node representing the module
 */
function createModuleNode(
  module: ModuleStructure,
  pkg: PackageStructure,
  positions: HandlePositions,
  includePackages: boolean
): DependencyNode {
  const dimensions = estimateNodeDimensions('module');

  const moduleNode: DependencyNode = {
    id: module.id,
    type: 'module' as DependencyKind,
    position: { x: 0, y: 0 },
    sourcePosition: positions.sourcePosition,
    targetPosition: positions.targetPosition,
    width: dimensions.width,
    height: dimensions.height,
    data: {
      label: module.name,
      properties: [
        { name: 'package', type: pkg.name, visibility: 'public' },
        { name: 'path', type: module.source.relativePath || '', visibility: 'public' },
      ],
    },
    style: {
      ...getNodeStyle('module'),
      width: dimensions.width,
      height: dimensions.height,
    },
  };

  // Only add parent relationship if packages are included
  if (includePackages) {
    moduleNode.parentNode = pkg.id;
    moduleNode.extent = 'parent' as const;
    moduleNode.expandParent = true;
    moduleNode.data = { ...moduleNode.data, parentId: pkg.id, label: moduleNode.data?.label ?? moduleNode.id };
  }

  return moduleNode;
}

/**
 * Creates a class node
 * @param cls The class structure
 * @param moduleId The parent module ID
 * @param positions Handle positions for the node
 * @returns A dependency node representing the class
 */
function createClassNode(cls: ClassStructure, moduleId: string, positions: HandlePositions): DependencyNode {
  const properties = convertPropertiesToNodeProperties(cls.properties);
  const methods = convertMethodsToNodeMethods(cls.methods);
  const dimensions = estimateNodeDimensions('class', { properties, methods });

  return {
    id: cls.id,
    type: 'class' as DependencyKind,
    position: { x: 0, y: 0 },
    sourcePosition: positions.sourcePosition,
    targetPosition: positions.targetPosition,
    parentNode: moduleId,
    extent: 'parent' as const,
    expandParent: true,
    width: dimensions.width,
    height: dimensions.height,
    data: {
      parentId: moduleId,
      label: cls.name,
      properties,
      methods,
    },
    style: {
      ...getNodeStyle('class'),
      width: dimensions.width,
      height: dimensions.height,
    },
  };
}

/**
 * Creates an interface node
 * @param iface The interface structure
 * @param moduleId The parent module ID
 * @param positions Handle positions for the node
 * @returns A dependency node representing the interface
 */
function createInterfaceNode(iface: InterfaceStructure, moduleId: string, positions: HandlePositions): DependencyNode {
  const properties = convertPropertiesToNodeProperties(iface.properties);
  const methods = convertMethodsToNodeMethods(iface.methods);
  const dimensions = estimateNodeDimensions('interface', { properties, methods });

  return {
    id: iface.id,
    type: 'interface' as DependencyKind,
    position: { x: 0, y: 0 },
    sourcePosition: positions.sourcePosition,
    targetPosition: positions.targetPosition,
    parentNode: moduleId,
    extent: 'parent' as const,
    expandParent: true,
    width: dimensions.width,
    height: dimensions.height,
    data: {
      parentId: moduleId,
      label: iface.name,
      properties,
      methods,
    },
    style: {
      ...getNodeStyle('interface'),
      width: dimensions.width,
      height: dimensions.height,
    },
  };
}

/**
 * Creates graph nodes from the provided dependency package graph data
 * @param data The dependency package graph data
 * @param options Configuration options for node creation
 * @returns Array of dependency nodes
 */
export function createGraphNodes(
  data: DependencyPackageGraph,
  options: CreateGraphNodesOptions = {}
): DependencyNode[] {
  const { includePackages = false, includeClasses = false, direction = 'LR', visibleNodeTypes } = options;

  const positions = calculateHandlePositions(direction);

  const graphNodes: DependencyNode[] = [];

  // Create package nodes if requested
  if (includePackages && shouldIncludeNodeType('package', visibleNodeTypes)) {
    data.packages.forEach((pkg) => {
      graphNodes.push(createPackageNode(pkg, positions));
    });
  }

  // Create module, class, and interface nodes
  data.packages.forEach((pkg) => {
    if (pkg.modules && shouldIncludeNodeType('module', visibleNodeTypes)) {
      mapTypeCollection(pkg.modules, (module) => {
        // Add module node
        graphNodes.push(createModuleNode(module, pkg, positions, includePackages));

        // Optionally add class and interface nodes
        if (includeClasses) {
          // Add class nodes
          if (module.classes && shouldIncludeNodeType('class', visibleNodeTypes)) {
            mapTypeCollection(module.classes, (cls) => {
              graphNodes.push(createClassNode(cls, module.id, positions));
            });
          }

          // Add interface nodes
          if (module.interfaces && shouldIncludeNodeType('interface', visibleNodeTypes)) {
            mapTypeCollection(module.interfaces, (iface) => {
              graphNodes.push(createInterfaceNode(iface, module.id, positions));
            });
          }
        }
      });
    }
  });

  return graphNodes;
}
