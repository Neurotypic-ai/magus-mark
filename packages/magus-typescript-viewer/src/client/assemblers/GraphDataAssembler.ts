import { createLogger } from '../../shared/utils/logger';
import { typeCollectionToArray } from '../utils/typeCollectionHelpers';

import type { Module } from '../../shared/types/Module';
import type { Package } from '../../shared/types/Package';
import type { DependencyPackageGraph } from '../components/DependencyGraph/types';

// Define the missing structures that are used in the class but not externally defined
// These were previously used but now NodeProperty/NodeMethod are used more directly
// interface PropertyStructure {
//   id: string;
//   name: string;
//   type: string;
//   default_value: string;
//   visibility: string;
//   is_static: boolean;
//   created_at: string;
// }

// interface MethodStructure {
//   id: string;
//   name: string;
//   parameters: Parameter[];
//   return_type: string;
//   visibility: string;
//   is_static: boolean;
//   created_at: string;
// }

const assemblerLogger = createLogger('GraphDataAssembler');

// Cache for memoizing the graph data
class GraphDataCache {
  private static instance: GraphDataCache | null = null;
  private cache = new Map<string, { data: DependencyPackageGraph; timestamp: number }>();
  private readonly MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): GraphDataCache {
    return (GraphDataCache.instance ??= new GraphDataCache());
  }

  public get(key: string): DependencyPackageGraph | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache is still valid
    const now = Date.now();
    if (now - entry.timestamp > this.MAX_AGE_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  public set(key: string, data: DependencyPackageGraph): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export class GraphDataAssembler {
  private readonly baseUrl: string;
  private readonly cache: GraphDataCache;

  constructor(baseUrl = 'http://localhost:4001') {
    this.baseUrl = baseUrl;
    this.cache = GraphDataCache.getInstance();
  }

  /**
   * Creates the normalized graph data structure with flat Maps
   * @param packages The packages from API
   * @param modules The modules from API
   * @returns A normalized DependencyPackageGraph object
   */
  private createGraphData(packages: Package[], modules: Module[]): DependencyPackageGraph {
    const graph: DependencyPackageGraph = {
      packages: new Map(),
      modules: new Map(),
      classes: new Map(),
      interfaces: new Map(),
      types: new Map(),
      enums: new Map(),
    };

    // Populate packages Map
    for (const pkg of packages) {
      graph.packages.set(pkg.id, pkg);
    }

    // Populate modules Map and extract nested entities
    for (const module of modules) {
      graph.modules.set(module.id, module);

      // Extract and flatten classes
      const classesArray = typeCollectionToArray(module.classes);
      for (const cls of classesArray) {
        graph.classes.set(cls.id, cls);
      }

      // Extract and flatten interfaces
      const interfacesArray = typeCollectionToArray(module.interfaces);
      for (const iface of interfacesArray) {
        graph.interfaces.set(iface.id, iface);
      }

      // Extract and flatten type aliases
      const typesArray = typeCollectionToArray(module.typeAliases);
      for (const type of typesArray) {
        graph.types.set(type.uuid, type);
      }

      // Extract and flatten enums
      const enumsArray = typeCollectionToArray(module.enums);
      for (const enumItem of enumsArray) {
        graph.enums.set(enumItem.id, enumItem);
      }
    }

    return graph;
  }

  /**
   * Assembles graph data from the API with caching and abort controller support
   * @param signal Optional AbortSignal to cancel the fetch operations
   * @returns A Promise resolving to the dependency package graph
   */
  async assembleGraphData(signal?: AbortSignal): Promise<DependencyPackageGraph> {
    assemblerLogger.info('Starting graph data assembly');
    try {
      // Check cache first
      const cacheKey = this.baseUrl;
      assemblerLogger.debug(`Checking cache with key: ${cacheKey}`);
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        assemblerLogger.info('Cache hit! Returning cached data');
        assemblerLogger.debug(`Cached data has ${String(cachedData.packages.size)} packages`);
        return cachedData;
      }
      assemblerLogger.debug('Cache miss. Fetching fresh data...');

      assemblerLogger.debug(`Fetching from URL: ${this.baseUrl}/packages`);
      const packagesResponse = await fetch(`${this.baseUrl}/packages`, signal ? { signal } : {});
      if (!packagesResponse.ok) {
        assemblerLogger.error(`HTTP error: ${String(packagesResponse.status)}`);
        throw new Error(`HTTP error! status: ${packagesResponse.status.toString()}`);
      }
      const packages = (await packagesResponse.json()) as Package[];
      assemblerLogger.info(`Fetched ${String(packages.length)} packages`);

      // Fetch modules for all packages
      assemblerLogger.debug('Fetching modules for all packages...');
      const allModules: Module[] = [];

      for (const pkg of packages) {
        assemblerLogger.debug(`Fetching modules for package: ${pkg.name}`);
        const modulesResponse = await fetch(`${this.baseUrl}/modules?packageId=${pkg.id}`, signal ? { signal } : {});
        if (!modulesResponse.ok) {
          assemblerLogger.error(`Failed to fetch modules for ${pkg.name}: ${String(modulesResponse.status)}`);
          throw new Error(`HTTP error! status: ${modulesResponse.status.toString()}`);
        }
        const modules = (await modulesResponse.json()) as Module[];
        assemblerLogger.debug(`Fetched ${String(modules.length)} modules for package: ${pkg.name}`);
        allModules.push(...modules);
      }

      // Create the normalized graph data
      assemblerLogger.debug(
        `Creating normalized graph data with ${String(packages.length)} packages and ${String(allModules.length)} modules`
      );
      const graphData = this.createGraphData(packages, allModules);
      assemblerLogger.debug('Graph data created successfully');

      // Store in cache
      assemblerLogger.debug(`Storing data in cache with key: ${cacheKey}`);
      this.cache.set(cacheKey, graphData);
      assemblerLogger.debug('Data cached successfully');

      assemblerLogger.info('Assembly complete');
      return graphData;
    } catch (error) {
      assemblerLogger.error('Error during assembly', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred while assembling graph data');
    }
  }

  /**
   * Clears the cache for the graph data
   */
  public clearCache(): void {
    this.cache.clear();
    assemblerLogger.info('Cleared graph data cache');
  }
}
