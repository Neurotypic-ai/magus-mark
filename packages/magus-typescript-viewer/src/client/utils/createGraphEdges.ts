import { MarkerType } from '@vue-flow/core';

import { createLogger } from '../../shared/utils/logger';
import { getEdgeStyle } from '../theme/graphTheme';
import { typeCollectionToArray } from './typeCollectionHelpers';
import { getExternalPackageName } from './packageName';

import type { Class } from '../../shared/types/Class';
import type { Import } from '../../shared/types/Import';
import type { Interface } from '../../shared/types/Interface';
import type { Module } from '../../shared/types/Module';
import type { Package } from '../../shared/types/Package';
import type { DependencyEdgeKind, DependencyPackageGraph, GraphEdge } from '../components/DependencyGraph/types';

const logger = createLogger('createGraphEdges');

/**
 * Common edge marker configuration
 */
const EDGE_MARKER = {
  type: MarkerType.ArrowClosed,
  width: 20,
  height: 20,
};

/**
 * Normalizes a file path by converting backslashes to forward slashes and removing redundant parts
 * @param path The path to normalize
 * @returns Normalized path
 */
function normalizePath(path: string): string {
  // Convert backslashes to forward slashes
  let normalized = path.replace(/\\/g, '/');

  // Resolve '..' and '.' segments
  const parts = normalized.split('/');
  const result: string[] = [];

  for (const part of parts) {
    if (part === '..') {
      result.pop();
    } else if (part !== '.' && part !== '') {
      result.push(part);
    }
  }

  return result.join('/');
}

/**
 * Gets the directory portion of a file path
 * @param path The file path
 * @returns The directory path
 */
function getDirname(path: string): string {
  const normalized = normalizePath(path);
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash > 0 ? normalized.substring(0, lastSlash) : '';
}

/**
 * Joins path segments together
 * @param segments Path segments to join
 * @returns Joined path
 */
function joinPaths(...segments: string[]): string {
  return normalizePath(segments.join('/'));
}

/**
 * Extracts the top-level package name from an import path
 * Examples:
 *  - 'lodash/map' -> 'lodash'
 *  - '@scope/pkg/sub' -> '@scope/pkg'
 */
// moved to utils/packageName.ts

/**
 * Builds a lookup map from module paths to module IDs
 * @param data The dependency package graph data
 * @returns Map of normalized paths to module IDs
 */
function buildModulePathMap(data: DependencyPackageGraph): Map<string, string> {
  const pathMap = new Map<string, string>();

  // Iterate through all modules in the normalized structure
  for (const [_id, module] of data.modules) {
    // Normalize the path to handle different separators
    const normalizedPath = normalizePath(module.source.relativePath);
    pathMap.set(normalizedPath, module.id);

    // Also add without extension for matching flexibility
    const withoutExt = normalizedPath.replace(/\.(ts|tsx|js|jsx)$/, '');
    pathMap.set(withoutExt, module.id);
  }

  return pathMap;
}

/**
 * Resolves an import path relative to the importing module
 * @param importerPath The path of the module doing the import
 * @param importPath The relative import path
 * @returns The resolved absolute path
 */
function resolveImportPath(importerPath: string, importPath: string): string {
  const importerDir = getDirname(importerPath);
  return joinPaths(importerDir, importPath);
}

/**
 * Creates a graph edge with common properties
 * @param id The edge ID
 * @param source The source node ID
 * @param target The target node ID
 * @param edgeType The type of edge relationship
 * @returns A graph edge
 */
function createEdge(id: string, source: string, target: string, edgeType: DependencyEdgeKind): GraphEdge {
  return {
    id,
    source,
    target,
    hidden: false,
    data: { type: edgeType },
    style: getEdgeStyle(edgeType),
    markerEnd: EDGE_MARKER,
  };
}

/**
 * Creates package dependency edges for a package (dependency, devDependency, peerDependency)
 * @param pkg The package from shared types
 * @returns Array of dependency edges
 */
function createPackageDependencyEdges(pkg: Package): GraphEdge[] {
  const edges: GraphEdge[] = [];

  // Regular dependencies
  typeCollectionToArray(pkg.dependencies).forEach((dep: Package) => {
    if (dep.id) {
      edges.push(createEdge(`${pkg.id}-${dep.id}-dependency`, pkg.id, dep.id, 'dependency'));
    }
  });

  // Dev dependencies
  typeCollectionToArray(pkg.devDependencies).forEach((dep: Package) => {
    if (dep.id) {
      edges.push(createEdge(`${pkg.id}-${dep.id}-devDependency`, pkg.id, dep.id, 'devDependency'));
    }
  });

  // Peer dependencies
  typeCollectionToArray(pkg.peerDependencies).forEach((dep: Package) => {
    if (dep.id) {
      edges.push(createEdge(`${pkg.id}-${dep.id}-peerDependency`, pkg.id, dep.id, 'peerDependency'));
    }
  });

  return edges;
}

/**
 * Creates import edges for a module
 * Arrow points FROM imported module TO importing module (shows "is used by" relationship)
 * @param module The module from shared types
 * @param modulePathMap Map of paths to module IDs
 * @returns Array of import edges
 */
function createModuleImportEdges(module: Module, modulePathMap: Map<string, string>): GraphEdge[] {
  const edges: GraphEdge[] = [];

  typeCollectionToArray(module.imports).forEach((imp: Import) => {
    if (!imp.relativePath) return;

    const importPath = imp.relativePath;
    const isExternal = !importPath.startsWith('.') && !importPath.startsWith('/') && !importPath.startsWith('file:');

    if (isExternal) {
      // External package import: point edge FROM external package node TO importing module
      const pkgName = getExternalPackageName(importPath);
      const externalId = `external:${pkgName}`;
      edges.push(createEdge(`${externalId}-${module.id}-uses`, externalId, module.id, 'uses'));
      return;
    }

    // Internal import: resolve to module file
    const resolvedPath = resolveImportPath(module.source.relativePath, importPath);

    // Look up the target module ID (with/without extension)
    const targetModuleId =
      modulePathMap.get(resolvedPath) ?? modulePathMap.get(resolvedPath.replace(/\.(ts|tsx|js|jsx)$/, ''));

    if (targetModuleId && targetModuleId !== module.id) {
      edges.push(createEdge(`${targetModuleId}-${module.id}-import`, targetModuleId, module.id, 'import'));
    }
  });

  return edges;
}

/**
 * Creates export edges for a module
 * Arrow points FROM exporting module TO exported module (shows "exports from" relationship)
 * @param module The module from shared types
 * @param modulePathMap Map of paths to module IDs
 * @returns Array of export edges
 */
function createModuleExportEdges(_module: Module, _modulePathMap: Map<string, string>): GraphEdge[] {
  const edges: GraphEdge[] = [];

  // Note: Export edges are not implemented as Export type doesn't have path information
  // The Export type only contains metadata about what is exported, not where it's exported to
  // This would require a different approach to track re-exports

  return edges;
}

/**
 * Creates class relationship edges (inheritance and implements)
 * @param cls The class from shared types
 * @returns Array of class relationship edges
 */
function createClassRelationshipEdges(cls: Class): GraphEdge[] {
  const edges: GraphEdge[] = [];

  // Handle class inheritance
  if (cls.extends_id) {
    edges.push(createEdge(`${cls.id}-${cls.extends_id}-inheritance`, cls.id, cls.extends_id, 'inheritance'));
  }

  // Handle interface implementations
  // Note: implemented_interfaces can be either:
  // 1. A Map<string, Interface> (after data assembly)
  // 2. Interface[] array
  // 3. A plain object dictionary { "interface-id": true } (from API)
  const implementedInterfaces = cls.implemented_interfaces;

  // Handle different TypeCollection formats
  if (implementedInterfaces instanceof Map) {
    // Map<string, Interface>
    implementedInterfaces.forEach((iface: Interface) => {
      if (iface.id) {
        const edge = createEdge(`${cls.id}-${iface.id}-implements`, cls.id, iface.id, 'implements');
        logger.debug(`Creating implements edge: ${cls.name} -> ${iface.name || iface.id}`);
        edges.push(edge);
      }
    });
  } else if (Array.isArray(implementedInterfaces)) {
    // Interface[]
    implementedInterfaces.forEach((iface: Interface) => {
      if (iface.id) {
        const edge = createEdge(`${cls.id}-${iface.id}-implements`, cls.id, iface.id, 'implements');
        logger.debug(`Creating implements edge: ${cls.name} -> ${iface.name || iface.id}`);
        edges.push(edge);
      }
    });
  } else {
    // Plain object dictionary { "interface-id": true }
    const interfaceIds = Object.keys(implementedInterfaces);
    logger.debug(`Class ${cls.name} implements ${String(interfaceIds.length)} interfaces:`, interfaceIds);
    interfaceIds.forEach((interfaceId) => {
      const edge = createEdge(`${cls.id}-${interfaceId}-implements`, cls.id, interfaceId, 'implements');
      logger.debug(`Creating implements edge: ${cls.name} -> ${interfaceId}`);
      edges.push(edge);
    });
  }

  return edges;
}

/**
 * Creates interface inheritance edges
 * @param iface The interface from shared types
 * @returns Array of interface inheritance edges
 */
function createInterfaceInheritanceEdges(iface: Interface): GraphEdge[] {
  const edges: GraphEdge[] = [];

  const extendedInterfaces = iface.extended_interfaces;

  // Handle different TypeCollection formats
  if (extendedInterfaces instanceof Map) {
    extendedInterfaces.forEach((extended: Interface) => {
      if (extended.id) {
        edges.push(createEdge(`${iface.id}-${extended.id}-inheritance`, iface.id, extended.id, 'inheritance'));
      }
    });
  } else if (Array.isArray(extendedInterfaces)) {
    extendedInterfaces.forEach((extended: Interface) => {
      if (extended.id) {
        edges.push(createEdge(`${iface.id}-${extended.id}-inheritance`, iface.id, extended.id, 'inheritance'));
      }
    });
  } else {
    // Plain object dictionary { "interface-id": true }
    const interfaceIds = Object.keys(extendedInterfaces);
    interfaceIds.forEach((interfaceId) => {
      edges.push(createEdge(`${iface.id}-${interfaceId}-inheritance`, iface.id, interfaceId, 'inheritance'));
    });
  }

  return edges;
}

/**
 * Creates graph edges from the provided dependency package graph data
 * @param data The dependency package graph data
 * @returns Array of edges for the dependency graph
 */
export function createGraphEdges(data: DependencyPackageGraph): GraphEdge[] {
  logger.info('Starting edge creation');
  logger.debug(`Input: ${String(data.packages.size)} packages`);
  const edges: GraphEdge[] = [];

  // Build module path lookup for import resolution
  logger.debug('Building module path map...');
  const modulePathMap = buildModulePathMap(data);
  logger.debug(`Module path map has ${String(modulePathMap.size)} entries`);

  // Process each package
  logger.debug('Processing packages...');
  let packageDepEdges = 0;
  let importEdges = 0;
  let exportEdges = 0;
  let classEdges = 0;
  let interfaceEdges = 0;

  // Create package dependency edges
  for (const [_id, pkg] of data.packages) {
    const pkgEdges = createPackageDependencyEdges(pkg);
    edges.push(...pkgEdges);
    packageDepEdges += pkgEdges.length;
    if (packageDepEdges <= 10 && pkgEdges.length > 0) {
      logger.debug(`Package ${pkg.name} has ${String(pkgEdges.length)} dependency edges`);
    }
  }

  // Process all modules
  for (const [_id, module] of data.modules) {
    // Create module import and export edges
    const modImportEdges = createModuleImportEdges(module, modulePathMap);
    const modExportEdges = createModuleExportEdges(module, modulePathMap);
    edges.push(...modImportEdges, ...modExportEdges);
    importEdges += modImportEdges.length;
    exportEdges += modExportEdges.length;
  }

  // Create class relationship edges
  let implementsEdgeCount = 0;
  let inheritanceEdgeCount = 0;
  for (const [_id, cls] of data.classes) {
    const clsEdges = createClassRelationshipEdges(cls);
    // Count edge types
    clsEdges.forEach((edge) => {
      if (edge.data?.type === 'implements') implementsEdgeCount++;
      if (edge.data?.type === 'inheritance') inheritanceEdgeCount++;
    });
    edges.push(...clsEdges);
    classEdges += clsEdges.length;
  }
  logger.info(`  - Class implements edges: ${String(implementsEdgeCount)}`);
  logger.info(`  - Class inheritance edges: ${String(inheritanceEdgeCount)}`);

  // Create interface inheritance edges
  for (const [_id, iface] of data.interfaces) {
    const ifaceEdges = createInterfaceInheritanceEdges(iface);
    edges.push(...ifaceEdges);
    interfaceEdges += ifaceEdges.length;
  }

  logger.info(`Edge creation complete:`);
  logger.info(`  - Package dependencies: ${String(packageDepEdges)}`);
  logger.info(`  - Import edges: ${String(importEdges)}`);
  logger.info(`  - Export edges: ${String(exportEdges)}`);
  logger.info(`  - Class relationship edges: ${String(classEdges)}`);
  logger.info(`  - Interface inheritance edges: ${String(interfaceEdges)}`);
  logger.info(`  - Total edges: ${String(edges.length)}`);

  return edges;
}
