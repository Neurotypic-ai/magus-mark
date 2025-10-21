import { createLogger } from '../../shared/utils/logger';
import { mapTypeCollection } from '../components/DependencyGraph/mapTypeCollection';

import type {
  ClassStructure,
  DependencyEdgeKind,
  DependencyPackageGraph,
  GraphEdge,
  InterfaceStructure,
  ModuleStructure,
  PackageStructure,
} from '../components/DependencyGraph/types';

const logger = createLogger('createGraphEdges');

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
 * Builds a lookup map from module paths to module IDs
 * @param data The dependency package graph data
 * @returns Map of normalized paths to module IDs
 */
function buildModulePathMap(data: DependencyPackageGraph): Map<string, string> {
  const pathMap = new Map<string, string>();

  data.packages.forEach((pkg) => {
    if (pkg.modules) {
      mapTypeCollection(pkg.modules, (module) => {
        // Normalize the path to handle different separators
        const normalizedPath = normalizePath(module.source.relativePath);
        pathMap.set(normalizedPath, module.id);

        // Also add without extension for matching flexibility
        const withoutExt = normalizedPath.replace(/\.(ts|tsx|js|jsx)$/, '');
        pathMap.set(withoutExt, module.id);
      });
    }
  });

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
 * Creates a graph edge in Cytoscape format
 * @param id The edge ID
 * @param source The source node ID
 * @param target The target node ID
 * @param edgeType The type of edge relationship
 * @returns A graph edge in Cytoscape format
 */
function createEdge(id: string, source: string, target: string, edgeType: DependencyEdgeKind): GraphEdge {
  return {
    group: 'edges',
    data: {
      id,
      source,
      target,
      type: edgeType,
      label: edgeType,
    },
    selectable: true,
    classes: `edge-${edgeType}`,
  };
}

/**
 * Creates package dependency edges for a package (dependency, devDependency, peerDependency)
 * @param pkg The package structure
 * @returns Array of dependency edges
 */
function createPackageDependencyEdges(pkg: PackageStructure): GraphEdge[] {
  const edges: GraphEdge[] = [];

  // Regular dependencies
  if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
    mapTypeCollection(pkg.dependencies, (dep) => {
      if (dep.id) {
        edges.push(createEdge(`${pkg.id}-${dep.id}-dependency`, pkg.id, dep.id, 'dependency'));
      }
    });
  }

  // Dev dependencies
  if (pkg.devDependencies && Object.keys(pkg.devDependencies).length > 0) {
    mapTypeCollection(pkg.devDependencies, (dep) => {
      if (dep.id) {
        edges.push(createEdge(`${pkg.id}-${dep.id}-devDependency`, pkg.id, dep.id, 'devDependency'));
      }
    });
  }

  // Peer dependencies
  if (pkg.peerDependencies && Object.keys(pkg.peerDependencies).length > 0) {
    mapTypeCollection(pkg.peerDependencies, (dep) => {
      if (dep.id) {
        edges.push(createEdge(`${pkg.id}-${dep.id}-peerDependency`, pkg.id, dep.id, 'peerDependency'));
      }
    });
  }

  return edges;
}

/**
 * Creates import edges for a module
 * Arrow points FROM imported module TO importing module (shows "is used by" relationship)
 * @param module The module structure
 * @param modulePathMap Map of paths to module IDs
 * @returns Array of import edges
 */
function createModuleImportEdges(module: ModuleStructure, modulePathMap: Map<string, string>): GraphEdge[] {
  const edges: GraphEdge[] = [];

  if (module.imports && Object.keys(module.imports).length > 0) {
    mapTypeCollection(module.imports, (imp) => {
      if (!imp.path) return; // Skip imports without paths (e.g., external npm packages)

      // Resolve the import path relative to the current module
      const resolvedPath = resolveImportPath(module.source.relativePath, imp.path);

      // Look up the target module ID
      const targetModuleId =
        modulePathMap.get(resolvedPath) ?? modulePathMap.get(resolvedPath.replace(/\.(ts|tsx|js|jsx)$/, ''));

      if (targetModuleId && targetModuleId !== module.id) {
        // Arrow points FROM imported module TO importing module
        edges.push(createEdge(`${targetModuleId}-${module.id}-import`, targetModuleId, module.id, 'import'));
      }
    });
  }

  return edges;
}

/**
 * Creates export edges for a module
 * Arrow points FROM exporting module TO exported module (shows "exports from" relationship)
 * @param module The module structure
 * @param modulePathMap Map of paths to module IDs
 * @returns Array of export edges
 */
function createModuleExportEdges(module: ModuleStructure, modulePathMap: Map<string, string>): GraphEdge[] {
  const edges: GraphEdge[] = [];

  // Check if module has exports property
  const moduleWithExports = module as unknown as {
    exports?: Record<string, { uuid: string; name?: string; path?: string }>;
  };

  if (moduleWithExports.exports && Object.keys(moduleWithExports.exports).length > 0) {
    mapTypeCollection(moduleWithExports.exports, (exp) => {
      if (!exp.path) return; // Skip exports without paths

      // Resolve the export path relative to the current module
      const resolvedPath = resolveImportPath(module.source.relativePath, exp.path);

      // Look up the target module ID
      const targetModuleId =
        modulePathMap.get(resolvedPath) ?? modulePathMap.get(resolvedPath.replace(/\.(ts|tsx|js|jsx)$/, ''));

      if (targetModuleId && targetModuleId !== module.id) {
        edges.push(createEdge(`${module.id}-${targetModuleId}-export`, module.id, targetModuleId, 'export'));
      }
    });
  }

  return edges;
}

/**
 * Creates class relationship edges (inheritance and implements)
 * @param cls The class structure
 * @returns Array of class relationship edges
 */
function createClassRelationshipEdges(cls: ClassStructure): GraphEdge[] {
  const edges: GraphEdge[] = [];

  // Handle class inheritance
  if (cls.extends_id) {
    edges.push(createEdge(`${cls.id}-${cls.extends_id}-inheritance`, cls.id, cls.extends_id, 'inheritance'));
  }

  // Handle interface implementations
  if (cls.implemented_interfaces && Object.keys(cls.implemented_interfaces).length > 0) {
    mapTypeCollection(cls.implemented_interfaces, (iface) => {
      if (iface.id) {
        edges.push(createEdge(`${cls.id}-${iface.id}-implements`, cls.id, iface.id, 'implements'));
      }
    });
  }

  return edges;
}

/**
 * Creates interface inheritance edges
 * @param iface The interface structure
 * @returns Array of interface inheritance edges
 */
function createInterfaceInheritanceEdges(iface: InterfaceStructure): GraphEdge[] {
  const edges: GraphEdge[] = [];

  if (iface.extended_interfaces && Object.keys(iface.extended_interfaces).length > 0) {
    mapTypeCollection(iface.extended_interfaces, (extended) => {
      if (extended.id) {
        edges.push(createEdge(`${iface.id}-${extended.id}-inheritance`, iface.id, extended.id, 'inheritance'));
      }
    });
  }

  return edges;
}

/**
 * Creates graph edges from the provided dependency package graph data
 * @param data The dependency package graph data
 * @returns Array of edges for the dependency graph in Cytoscape format
 */
export function createGraphEdges(data: DependencyPackageGraph): GraphEdge[] {
  logger.info('Starting edge creation');
  logger.debug(`Input: ${String(data.packages.length)} packages`);
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

  data.packages.forEach((pkg, pkgIndex) => {
    // Create package dependency edges
    const pkgEdges = createPackageDependencyEdges(pkg);
    edges.push(...pkgEdges);
    packageDepEdges += pkgEdges.length;
    if (pkgIndex < 2 && pkgEdges.length > 0) {
      logger.debug(`Package ${pkg.name} has ${String(pkgEdges.length)} dependency edges`);
    }

    // Process modules within the package
    if (pkg.modules && Object.keys(pkg.modules).length > 0) {
      mapTypeCollection(pkg.modules, (module) => {
        // Create module import and export edges
        const modImportEdges = createModuleImportEdges(module, modulePathMap);
        const modExportEdges = createModuleExportEdges(module, modulePathMap);
        edges.push(...modImportEdges, ...modExportEdges);
        importEdges += modImportEdges.length;
        exportEdges += modExportEdges.length;

        // Create class relationship edges
        if (module.classes && Object.keys(module.classes).length > 0) {
          mapTypeCollection(module.classes, (cls) => {
            const clsEdges = createClassRelationshipEdges(cls);
            edges.push(...clsEdges);
            classEdges += clsEdges.length;
          });
        }

        // Create interface inheritance edges
        if (module.interfaces && Object.keys(module.interfaces).length > 0) {
          mapTypeCollection(module.interfaces, (iface) => {
            const ifaceEdges = createInterfaceInheritanceEdges(iface);
            edges.push(...ifaceEdges);
            interfaceEdges += ifaceEdges.length;
          });
        }
      });
    }
  });

  logger.info(`Edge creation complete:`);
  logger.info(`  - Package dependencies: ${String(packageDepEdges)}`);
  logger.info(`  - Import edges: ${String(importEdges)}`);
  logger.info(`  - Export edges: ${String(exportEdges)}`);
  logger.info(`  - Class relationship edges: ${String(classEdges)}`);
  logger.info(`  - Interface inheritance edges: ${String(interfaceEdges)}`);
  logger.info(`  - Total edges: ${String(edges.length)}`);

  return edges;
}
