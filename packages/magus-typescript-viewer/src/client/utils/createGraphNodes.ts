import { Position } from '@vue-flow/core';

import { createLogger } from '../../shared/utils/logger';
import { getNodeStyle } from '../theme/graphTheme';
import { typeCollectionToArray } from './typeCollectionHelpers';

import type { Class } from '../../shared/types/Class';
import type { Interface } from '../../shared/types/Interface';
import type { Method } from '../../shared/types/Method';
import type { Module } from '../../shared/types/Module';
import type { Package } from '../../shared/types/Package';
import type { Property } from '../../shared/types/Property';
import type {
  DependencyKind,
  DependencyNode,
  DependencyPackageGraph,
  NodeMethod,
  NodeProperty,
} from '../components/DependencyGraph/types';

const logger = createLogger('createGraphNodes');

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
 * Converts properties from a shared type to node properties for display
 * @param properties The TypeCollection of properties
 * @returns Array of formatted node properties
 */
function convertPropertiesToNodeProperties(properties: Property[]): NodeProperty[] {
  return typeCollectionToArray(properties).map((prop: Property) => ({
    name: prop.name,
    type: prop.type,
    visibility: prop.visibility,
  }));
}

/**
 * Converts methods from a shared type to node methods for display
 * @param methods The TypeCollection of methods
 * @returns Array of formatted node methods
 */
function convertMethodsToNodeMethods(methods: Method[]): NodeMethod[] {
  return typeCollectionToArray(methods).map((method: Method) => {
    return {
      name: method.name,
      returnType: method.return_type,
      visibility: method.visibility,
      signature: `${method.name}(): ${method.return_type}`,
    };
  });
}

/**
 * Creates a package node
 * @param pkg The package from shared types
 * @param positions Handle positions for the node
 * @returns A dependency node representing the package
 */
function createPackageNode(pkg: Package, positions: HandlePositions): DependencyNode {
  return {
    id: pkg.id,
    type: 'package' as DependencyKind,
    position: { x: 0, y: 0 },
    sourcePosition: positions.sourcePosition,
    targetPosition: positions.targetPosition,
    data: {
      label: pkg.name,
      properties: [{ name: 'version', type: pkg.version, visibility: 'public' }],
    },
    style: {
      ...getNodeStyle('package'),
    },
  };
}

/**
 * Creates a module node
 * @param module The module from shared types
 * @param pkg The parent package
 * @param positions Handle positions for the node
 * @param includePackages Whether to include package parent relationships
 * @returns A dependency node representing the module
 */
function createModuleNode(
  module: Module,
  pkg: Package,
  positions: HandlePositions,
  includePackages: boolean
): DependencyNode {
  const moduleNode: DependencyNode = {
    id: module.id,
    type: 'module' as DependencyKind,
    position: { x: 0, y: 0 },
    sourcePosition: positions.sourcePosition,
    targetPosition: positions.targetPosition,
    data: {
      label: module.name,
      properties: [
        { name: 'package', type: pkg.name, visibility: 'public' },
        { name: 'path', type: module.source.relativePath || '', visibility: 'public' },
      ],
    },
    style: {
      ...getNodeStyle('module'),
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
 * @param cls The class from shared types
 * @param module The parent module
 * @param positions Handle positions for the node
 * @returns A dependency node representing the class
 */
function createClassNode(cls: Class, module: Module, positions: HandlePositions): DependencyNode {
  const properties = convertPropertiesToNodeProperties(typeCollectionToArray(cls.properties));
  const methods = convertMethodsToNodeMethods(typeCollectionToArray(cls.methods));

  return {
    id: cls.id,
    type: 'class' as DependencyKind,
    position: { x: 0, y: 0 },
    sourcePosition: positions.sourcePosition,
    targetPosition: positions.targetPosition,
    parentNode: module.id,
    extent: 'parent' as const,
    expandParent: true,
    data: {
      parentId: module.id,
      label: cls.name,
      properties,
      methods,
    },
    style: {
      ...getNodeStyle('class'),
    },
  };
}

/**
 * Creates an interface node
 * @param iface The interface from shared types
 * @param moduleId The parent module ID
 * @param positions Handle positions for the node
 * @returns A dependency node representing the interface
 */
function createInterfaceNode(iface: Interface, module: Module, positions: HandlePositions): DependencyNode {
  const properties = convertPropertiesToNodeProperties(typeCollectionToArray(iface.properties));
  const methods = convertMethodsToNodeMethods(typeCollectionToArray(iface.methods));
  return {
    id: iface.id,
    type: 'interface',
    position: { x: 0, y: 0 },
    sourcePosition: positions.sourcePosition,
    targetPosition: positions.targetPosition,
    parentNode: module.id,
    extent: 'parent' as const,
    expandParent: true,
    data: {
      parentId: module.id,
      label: iface.name,
      properties,
      methods,
    },
    style: {
      ...getNodeStyle('interface'),
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
  logger.info('Starting node creation');
  logger.debug(`Input: ${String(data.packages.size)} packages`);
  const { includePackages = false, includeClasses = false, direction = 'LR', visibleNodeTypes } = options;
  logger.debug('Options:', {
    includePackages,
    includeClasses,
    direction,
    visibleNodeTypes: visibleNodeTypes ? Array.from(visibleNodeTypes) : 'all',
  });

  const positions = calculateHandlePositions(direction);
  logger.debug('Handle positions:', positions);

  const graphNodes: DependencyNode[] = [];

  // Create package nodes if requested
  if (includePackages && shouldIncludeNodeType('package', visibleNodeTypes)) {
    logger.debug(`Creating ${String(data.packages.size)} package nodes`);
    let index = 0;
    for (const [_id, pkg] of data.packages) {
      if (index < 3) {
        logger.debug(`Creating package node [${String(index)}]: ${pkg.name}`);
      }
      graphNodes.push(createPackageNode(pkg, positions));
      index++;
    }
    logger.debug(`Created ${String(data.packages.size)} package nodes`);
  } else {
    logger.debug('Skipping package nodes (includePackages=false or filtered out)');
  }

  // Create module nodes
  logger.debug('Processing modules...');
  let moduleCount = 0;

  for (const [_id, module] of data.modules) {
    if (shouldIncludeNodeType('module', visibleNodeTypes)) {
      const pkg = data.packages.get(module.package_id);
      if (pkg) {
        graphNodes.push(createModuleNode(module, pkg, positions, includePackages));
        moduleCount++;
      }
    }
  }

  // Create class nodes if requested
  if (includeClasses && shouldIncludeNodeType('class', visibleNodeTypes)) {
    logger.debug('Processing classes...');
    let classCount = 0;

    for (const [_id, cls] of data.classes) {
      const module = data.modules.get(cls.module_id);
      if (module) {
        graphNodes.push(createClassNode(cls, module, positions));
        classCount++;
      }
    }
    logger.debug(`Created ${String(classCount)} class nodes`);
  }

  // Create interface nodes if requested
  if (includeClasses && shouldIncludeNodeType('interface', visibleNodeTypes)) {
    logger.debug('Processing interfaces...');
    let interfaceCount = 0;

    for (const [_id, iface] of data.interfaces) {
      const module = data.modules.get(iface.module_id);
      if (module) {
        graphNodes.push(createInterfaceNode(iface, module, positions));
        interfaceCount++;
      }
    }
    logger.debug(`Created ${String(interfaceCount)} interface nodes`);
  }

  logger.info(`Node creation complete:`);
  logger.info(`  - Modules: ${String(moduleCount)}`);
  logger.info(`  - Classes: ${String(data.classes.size)}`);
  logger.info(`  - Interfaces: ${String(data.interfaces.size)}`);
  logger.info(`  - Total nodes: ${String(graphNodes.length)}`);

  return graphNodes;
}
