import { Module } from '../shared/types/Module';
import { createLogger } from '../shared/utils/logger';
import { Database } from './db/Database';
import { DuckDBAdapter } from './db/adapter/DuckDBAdapter';
import { RepositoryError } from './db/errors/RepositoryError';
import { ClassRepository } from './db/repositories/ClassRepository';
import { InterfaceRepository } from './db/repositories/InterfaceRepository';
import { ModuleRepository } from './db/repositories/ModuleRepository';
import { PackageRepository } from './db/repositories/PackageRepository';

import type { Package } from '../shared/types/Package';

export class ApiServerResponder {
  private readonly database: Database;
  private readonly dbAdapter: DuckDBAdapter;
  private readonly logger;

  private readonly classRepository: ClassRepository;
  private readonly interfaceRepository: InterfaceRepository;
  private readonly moduleRepository: ModuleRepository;
  private readonly packageRepository: PackageRepository;

  constructor() {
    this.dbAdapter = new DuckDBAdapter('typescript-viewer.duckdb');
    this.database = new Database(this.dbAdapter, 'typescript-viewer.duckdb');
    this.logger = createLogger('ApiServerResponder');

    // Initialize repositories
    this.classRepository = new ClassRepository(this.dbAdapter);
    this.interfaceRepository = new InterfaceRepository(this.dbAdapter);
    this.moduleRepository = new ModuleRepository(this.dbAdapter);
    this.packageRepository = new PackageRepository(this.dbAdapter);
  }

  async initialize(): Promise<void> {
    try {
      await this.database.initializeDatabase(false);
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }
      throw new RepositoryError(
        'Failed to initialize database',
        'initialize',
        'ApiServerResponder',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async getPackages(): Promise<Package[]> {
    try {
      return await this.packageRepository.retrieve();
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }
      throw new RepositoryError(
        'Failed to get packages',
        'getPackages',
        'ApiServerResponder',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async getModules(packageId: string): Promise<Module[]> {
    try {
      const modules = await this.moduleRepository.retrieveAll(packageId);
      const enrichedModules: Module[] = [];

      // Process modules sequentially to avoid overwhelming the database
      for (const mod of modules) {
        try {
          // Load classes first
          const classes = new Map();
          const classesArray = await this.classRepository.retrieve(undefined, mod.id);

          // Process each class sequentially
          for (const cls of classesArray) {
            try {
              // Use repository methods directly
              const methods = await this.classRepository.retrieveMethods(cls.id);
              const properties = await this.classRepository.retrieveProperties(cls.id);

              // Create class with its methods and properties
              classes.set(cls.id, {
                id: cls.id,
                package_id: cls.package_id,
                module_id: cls.module_id,
                name: cls.name,
                created_at: cls.created_at,
                methods,
                properties,
                implemented_interfaces: cls.implemented_interfaces,
                extends_id: cls.extends_id,
              });
            } catch (error) {
              this.logger.error(`Failed to process class ${cls.id} in module ${mod.id}:`, error);
              // Continue with next class
            }
          }

          // Load interfaces
          const interfaces = new Map();
          const interfacesArray = await this.interfaceRepository.retrieve(undefined, mod.id);

          // Process each interface sequentially
          for (const iface of interfacesArray) {
            try {
              // Use repository methods directly
              const methods = await this.interfaceRepository.retrieveMethods(iface.id);
              const properties = await this.interfaceRepository.retrieveProperties(iface.id);

              // Create interface with its methods and properties
              interfaces.set(iface.id, {
                id: iface.id,
                package_id: iface.package_id,
                module_id: iface.module_id,
                name: iface.name,
                created_at: iface.created_at,
                methods,
                properties,
                extended_interfaces: iface.extended_interfaces,
              });
            } catch (error) {
              this.logger.error(`Failed to process interface ${iface.id} in module ${mod.id}:`, error);
              // Continue with next interface
            }
          }

          // Create enriched module
          enrichedModules.push(
            new Module(
              mod.id,
              mod.package_id,
              mod.name,
              mod.source,
              mod.created_at,
              classes,
              interfaces,
              mod.imports,
              mod.exports,
              mod.packages,
              mod.typeAliases,
              mod.enums,
              mod.referencePaths
            )
          );
        } catch (error) {
          this.logger.error(`Failed to process module ${mod.id}:`, error);
          // Continue with next module
        }
      }

      return enrichedModules;
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }
      throw new RepositoryError(
        'Failed to get modules',
        'getModules',
        'ApiServerResponder',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
