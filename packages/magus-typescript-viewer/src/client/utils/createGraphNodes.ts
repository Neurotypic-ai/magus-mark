import { createLogger } from '../../shared/utils/logger';
import { mapTypeCollection } from '../components/DependencyGraph/mapTypeCollection';

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

const logger = createLogger('createGraphNodes');

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
 * Creates a package node in Cytoscape format
 * @param pkg The package structure
 * @returns A dependency node representing the package
 */
function createPackageNode(pkg: PackageStructure): DependencyNode {
  return {
    group: 'nodes',
    data: {
      id: pkg.id,
      label: pkg.name,
      type: 'package' as DependencyKind,
      properties: [{ name: 'version', type: pkg.version, visibility: 'public' }],
    },
    selectable: true,
    grabbable: true,
    classes: 'package-node',
  };
}

/**
 * Creates a module node in Cytoscape format
 * @param module The module structure
 * @param pkg The parent package
 * @param includePackages Whether to include package parent relationships
 * @returns A dependency node representing the module
 */
function createModuleNode(module: ModuleStructure, pkg: PackageStructure, includePackages: boolean): DependencyNode {
  const nodeData: DependencyNode['data'] = {
    id: module.id,
    label: module.name,
    type: 'module' as DependencyKind,
    properties: [
      { name: 'package', type: pkg.name, visibility: 'public' },
      { name: 'path', type: module.source.relativePath || '', visibility: 'public' },
    ],
  };

  // Only add parent relationship if packages are included
  if (includePackages) {
    nodeData.parent = pkg.id;
    nodeData.parentId = pkg.id;
  }

  return {
    group: 'nodes',
    data: nodeData,
    selectable: true,
    grabbable: true,
    classes: 'module-node',
  };
}

/**
 * Creates a class node in Cytoscape format
 * @param cls The class structure
 * @param moduleId The parent module ID
 * @returns A dependency node representing the class
 */
function createClassNode(cls: ClassStructure, moduleId: string): DependencyNode {
  const properties = convertPropertiesToNodeProperties(cls.properties);
  const methods = convertMethodsToNodeMethods(cls.methods);

  return {
    group: 'nodes',
    data: {
      id: cls.id,
      label: cls.name,
      type: 'class' as DependencyKind,
      parent: moduleId,
      parentId: moduleId,
      properties,
      methods,
    },
    selectable: true,
    grabbable: true,
    classes: 'class-node',
  };
}

/**
 * Creates an interface node in Cytoscape format
 * @param iface The interface structure
 * @param moduleId The parent module ID
 * @returns A dependency node representing the interface
 */
function createInterfaceNode(iface: InterfaceStructure, moduleId: string): DependencyNode {
  const properties = convertPropertiesToNodeProperties(iface.properties);
  const methods = convertMethodsToNodeMethods(iface.methods);

  return {
    group: 'nodes',
    data: {
      id: iface.id,
      label: iface.name,
      type: 'interface' as DependencyKind,
      parent: moduleId,
      parentId: moduleId,
      properties,
      methods,
    },
    selectable: true,
    grabbable: true,
    classes: 'interface-node',
  };
}

/**
 * Creates graph nodes from the provided dependency package graph data
 * @param data The dependency package graph data
 * @param options Configuration options for node creation
 * @returns Array of dependency nodes in Cytoscape format
 */
export function createGraphNodes(
  data: DependencyPackageGraph,
  options: CreateGraphNodesOptions = {}
): DependencyNode[] {
  logger.info('Starting node creation');
  logger.debug(`Input: ${String(data.packages.length)} packages`);
  const { includePackages = false, includeClasses = false, visibleNodeTypes } = options;
  logger.debug('Options:', {
    includePackages,
    includeClasses,
    visibleNodeTypes: visibleNodeTypes ? Array.from(visibleNodeTypes) : 'all',
  });

  const graphNodes: DependencyNode[] = [];

  // Create package nodes if requested
  if (includePackages && shouldIncludeNodeType('package', visibleNodeTypes)) {
    logger.debug(`Creating ${String(data.packages.length)} package nodes`);
    data.packages.forEach((pkg, index) => {
      if (index < 3) {
        logger.debug(`Creating package node [${String(index)}]: ${pkg.name}`);
      }
      graphNodes.push(createPackageNode(pkg));
    });
    logger.debug(`Created ${String(data.packages.length)} package nodes`);
  } else {
    logger.debug('Skipping package nodes (includePackages=false or filtered out)');
  }

  // Create module, class, and interface nodes
  logger.debug('Processing modules, classes, and interfaces...');
  let moduleCount = 0;
  let classCount = 0;
  let interfaceCount = 0;

  data.packages.forEach((pkg, pkgIndex) => {
    if (pkg.modules && shouldIncludeNodeType('module', visibleNodeTypes)) {
      const modules = mapTypeCollection(pkg.modules, (module) => {
        // Add module node
        graphNodes.push(createModuleNode(module, pkg, includePackages));
        moduleCount++;

        // Optionally add class and interface nodes
        if (includeClasses) {
          // Add class nodes
          if (module.classes && shouldIncludeNodeType('class', visibleNodeTypes)) {
            const classesAdded = mapTypeCollection(module.classes, (cls) => {
              graphNodes.push(createClassNode(cls, module.id));
              classCount++;
              return cls;
            }).length;
            if (classesAdded > 0 && classCount <= 5) {
              logger.debug(`Added ${String(classesAdded)} class nodes from module ${module.name}`);
            }
          }

          // Add interface nodes
          if (module.interfaces && shouldIncludeNodeType('interface', visibleNodeTypes)) {
            const interfacesAdded = mapTypeCollection(module.interfaces, (iface) => {
              graphNodes.push(createInterfaceNode(iface, module.id));
              interfaceCount++;
              return iface;
            }).length;
            if (interfacesAdded > 0 && interfaceCount <= 5) {
              logger.debug(`Added ${String(interfacesAdded)} interface nodes from module ${module.name}`);
            }
          }
        }
        return module;
      });
      if (pkgIndex === 0) {
        logger.debug(`Package ${pkg.name} has ${String(modules.length)} modules`);
      }
    }
  });

  logger.info(`Node creation complete:`);
  logger.info(`  - Modules: ${String(moduleCount)}`);
  logger.info(`  - Classes: ${String(classCount)}`);
  logger.info(`  - Interfaces: ${String(interfaceCount)}`);
  logger.info(`  - Total nodes: ${String(graphNodes.length)}`);

  return graphNodes;
}
