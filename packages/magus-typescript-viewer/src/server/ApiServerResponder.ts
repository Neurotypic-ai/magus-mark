import { readFile } from 'fs/promises';

import jscodeshift from 'jscodeshift';

import { Module } from '../shared/types/Module';
import { createLogger } from '../shared/utils/logger';
import { Database } from './db/Database';
import { DuckDBAdapter } from './db/adapter/DuckDBAdapter';
import { RepositoryError } from './db/errors/RepositoryError';
import { ClassRepository } from './db/repositories/ClassRepository';
import { ImportRepository } from './db/repositories/ImportRepository';
import { ImportSpecifierRepository } from './db/repositories/ImportSpecifierRepository';
import { InterfaceRepository } from './db/repositories/InterfaceRepository';
import { ModuleRepository } from './db/repositories/ModuleRepository';
import { PackageRepository } from './db/repositories/PackageRepository';

import type { ASTNode, ASTPath, ClassDeclaration, TSInterfaceDeclaration } from 'jscodeshift';

import type { Class } from '../shared/types/Class';
import type { Import } from '../shared/types/Import';
import type { Interface } from '../shared/types/Interface';
import type { Package } from '../shared/types/Package';
import type { TypeCollection } from '../shared/types/TypeCollection';

export interface ApiServerResponderOptions {
  dbPath?: string;
  readOnly?: boolean;
}

export class ApiServerResponder {
  private readonly database: Database;
  private readonly dbAdapter: DuckDBAdapter;
  private readonly logger;
  private readonly readOnly: boolean;

  private readonly classRepository: ClassRepository;
  private readonly interfaceRepository: InterfaceRepository;
  private readonly importRepository: ImportRepository;
  private readonly importSpecifierRepository: ImportSpecifierRepository;
  private readonly moduleRepository: ModuleRepository;
  private readonly packageRepository: PackageRepository;

  constructor(options: ApiServerResponderOptions = {}) {
    const dbPath = options.dbPath ?? 'typescript-viewer.duckdb';
    this.readOnly = options.readOnly ?? false;
    this.dbAdapter = new DuckDBAdapter(dbPath, { allowWrite: !this.readOnly });
    this.database = new Database(this.dbAdapter, dbPath);
    this.logger = createLogger('ApiServerResponder');

    // Initialize repositories
    this.classRepository = new ClassRepository(this.dbAdapter);
    this.interfaceRepository = new InterfaceRepository(this.dbAdapter);
    this.importRepository = new ImportRepository(this.dbAdapter);
    this.importSpecifierRepository = new ImportSpecifierRepository(this.dbAdapter);
    this.moduleRepository = new ModuleRepository(this.dbAdapter);
    this.packageRepository = new PackageRepository(this.dbAdapter);
  }

  async initialize(): Promise<void> {
    try {
      // Initialize database connection (read-only mode, no schema changes or seeding)
      await this.database.initializeDatabase(false);
      this.logger.info(`Database initialized in ${this.readOnly ? 'read-only' : 'read-write'} mode`);
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

  async getPackages(): Promise<
    {
      id: string;
      name: string;
      version: string;
      path: string;
      created_at: Date;
      dependencies: TypeCollection<Package>;
      devDependencies: TypeCollection<Package>;
      peerDependencies: TypeCollection<Package>;
      modules: string[];
    }[]
  > {
    try {
      const packages = await this.packageRepository.retrieve();

      // Fetch module IDs for each package
      const packagesWithModuleIds = await Promise.all(
        packages.map(async (pkg) => {
          try {
            const modules = await this.moduleRepository.retrieveAll(pkg.id);
            const moduleIds = modules.map((mod) => mod.id);

            // Return plain object with moduleIds array
            return {
              id: pkg.id,
              name: pkg.name,
              version: pkg.version,
              path: pkg.path,
              created_at: pkg.created_at,
              dependencies: pkg.dependencies,
              devDependencies: pkg.devDependencies,
              peerDependencies: pkg.peerDependencies,
              modules: moduleIds,
            };
          } catch (error) {
            this.logger.error(`Failed to get module IDs for package ${pkg.id}`, error);
            return {
              id: pkg.id,
              name: pkg.name,
              version: pkg.version,
              path: pkg.path,
              created_at: pkg.created_at,
              dependencies: pkg.dependencies,
              devDependencies: pkg.devDependencies,
              peerDependencies: pkg.peerDependencies,
              modules: [],
            };
          }
        })
      );

      return packagesWithModuleIds;
    } catch (error) {
      this.logger.error('Failed to get packages, returning empty list', error);
      return [];
    }
  }

  async getModules(packageId: string): Promise<Module[]> {
    try {
      const modules = await this.moduleRepository.retrieveAll(packageId);
      const enrichedModules: Module[] = [];

      // Process modules sequentially to avoid overwhelming the database
      for (const mod of modules) {
        try {
          // AST fallback: pre-parse this module file to discover implements/extends
          const implementsByClass = new Map<string, string[]>();
          const extendsByInterface = new Map<string, string[]>();
          const neededInterfaceNames = new Set<string>();
          try {
            if (mod.source.filename) {
              const code = await readFile(mod.source.filename, 'utf-8');
              const j = jscodeshift.withParser('tsx');
              const root = j(code);

              // class Foo implements A, B<C>
              root.find(j.ClassDeclaration).forEach((p: ASTPath<ClassDeclaration>) => {
                const node = p.node;
                const name = node.id?.type === 'Identifier' ? node.id.name : undefined;
                if (!name) return;
                const implItems = (node as { implements?: unknown[] }).implements;
                const items: unknown[] = Array.isArray(implItems) ? implItems : [];
                const names: string[] = [];
                for (const it of items) {
                  const expr =
                    typeof it === 'object' && it !== null && 'expression' in (it as Record<string, unknown>)
                      ? (it as Record<string, unknown>)['expression']
                      : undefined;
                  let text = '';
                  if (expr && typeof expr === 'object' && 'name' in (expr as Record<string, unknown>)) {
                    const n = (expr as Record<string, unknown>)['name'];
                    if (typeof n === 'string') text = n;
                  }
                  if (!text && expr) {
                    try {
                      text = j(expr as ASTNode).toSource();
                    } catch {
                      text = '';
                    }
                  }
                  if (text) {
                    const base = (text.split('<')[0] ?? text).trim();
                    if (base) {
                      names.push(base);
                      neededInterfaceNames.add(base);
                    }
                  }
                }
                if (names.length) implementsByClass.set(name, names);
              });

              // interface X extends A, B<C>
              root.find(j.TSInterfaceDeclaration).forEach((p: ASTPath<TSInterfaceDeclaration>) => {
                const node = p.node;
                const name = node.id.type === 'Identifier' ? node.id.name : undefined;
                if (!name) return;
                const extItems = (node as { extends?: unknown[] }).extends;
                const items: unknown[] = Array.isArray(extItems) ? extItems : [];
                const names: string[] = [];
                for (const it of items) {
                  const expr =
                    typeof it === 'object' && it !== null && 'expression' in (it as Record<string, unknown>)
                      ? (it as Record<string, unknown>)['expression']
                      : undefined;
                  let text = '';
                  if (expr && typeof expr === 'object' && 'name' in (expr as Record<string, unknown>)) {
                    const n = (expr as Record<string, unknown>)['name'];
                    if (typeof n === 'string') text = n;
                  }
                  if (!text && expr) {
                    try {
                      text = j(expr as ASTNode).toSource();
                    } catch {
                      text = '';
                    }
                  }
                  if (text) {
                    const base = (text.split('<')[0] ?? text).trim();
                    if (base) {
                      names.push(base);
                      neededInterfaceNames.add(base);
                    }
                  }
                }
                if (names.length) extendsByInterface.set(name, names);
              });
            }
          } catch (error) {
            this.logger.warn(`AST fallback parse failed for module ${mod.id}`, error);
          }

          // Preload any referenced interfaces by name (across the DB)
          let ifaceByName = new Map<
            string,
            {
              id: string;
              name: string;
              package_id: string;
              module_id: string;
              created_at: Date;
              methods: Map<unknown, unknown>;
              properties: Map<unknown, unknown>;
              extended_interfaces: Map<unknown, unknown>;
            }
          >();
          if (neededInterfaceNames.size > 0) {
            try {
              const extras = await this.interfaceRepository.retrieveByNames(Array.from(neededInterfaceNames));
              extras.forEach((e) =>
                ifaceByName.set(e.name, {
                  id: e.id,
                  name: e.name,
                  package_id: e.package_id,
                  module_id: e.module_id,
                  created_at: e.created_at,
                  methods: new Map(),
                  properties: new Map(),
                  extended_interfaces: new Map(),
                })
              );
            } catch (error) {
              this.logger.warn('Failed to preload interfaces by name', error);
            }
          }

          // Load classes first
          const classes = new Map<string, unknown>();
          const classesArray = await this.classRepository.retrieve(undefined, mod.id);

          // Process each class sequentially
          for (const cls of classesArray) {
            try {
              // Create class with its methods and properties
              // Convert nested Maps to plain objects for JSON serialization
              const methodsObj = Object.fromEntries(cls.methods as Map<string, unknown>);
              const propertiesObj = Object.fromEntries(cls.properties as Map<string, unknown>);

              // Prefer DB-joined interfaces; if empty, use AST fallback mapping by class name
              let implementedMap: Map<string, unknown>;
              if (cls.implemented_interfaces instanceof Map && cls.implemented_interfaces.size > 0) {
                implementedMap = cls.implemented_interfaces as Map<string, unknown>;
              } else {
                const names = implementsByClass.get(cls.name) ?? [];
                const pairs: [string, unknown][] = [];
                // Also include interfaces defined in this module for precise mapping
                try {
                  const localIfaces = await this.interfaceRepository.retrieve(undefined, mod.id);
                  localIfaces.forEach((e) =>
                    ifaceByName.set(e.name, {
                      id: e.id,
                      name: e.name,
                      package_id: e.package_id,
                      module_id: e.module_id,
                      created_at: e.created_at,
                      methods: new Map(),
                      properties: new Map(),
                      extended_interfaces: new Map(),
                    })
                  );
                } catch {}
                names.forEach((n) => {
                  const obj = ifaceByName.get(n);
                  if (obj) pairs.push([obj.id, obj]);
                });
                implementedMap = new Map<string, unknown>(pairs);
              }
              const implementedObj = Object.fromEntries(implementedMap);

              classes.set(cls.id, {
                id: cls.id,
                package_id: cls.package_id,
                module_id: cls.module_id,
                name: cls.name,
                created_at: cls.created_at,
                methods: methodsObj,
                properties: propertiesObj,
                implemented_interfaces: implementedObj,
                extends_id: cls.extends_id,
              });
            } catch (error) {
              this.logger.error(`Failed to process class ${cls.id} in module ${mod.id}:`, error);
              // Continue with next class
            }
          }

          // Load interfaces
          const interfaces = new Map<string, unknown>();
          const interfacesArray = await this.interfaceRepository.retrieve(undefined, mod.id);

          // Process each interface sequentially
          for (const iface of interfacesArray) {
            try {
              // Create interface with its methods and properties
              // Convert nested Maps to plain objects for JSON serialization
              const methodsObj = Object.fromEntries(iface.methods as Map<string, unknown>);
              const propertiesObj = Object.fromEntries(iface.properties as Map<string, unknown>);

              // Prefer DB-joined extended interfaces; if empty, use AST fallback mapping
              let extendedMap: Map<string, unknown>;
              if (iface.extended_interfaces instanceof Map && iface.extended_interfaces.size > 0) {
                extendedMap = iface.extended_interfaces as Map<string, unknown>;
              } else {
                const names = extendsByInterface.get(iface.name) ?? [];
                const pairs: [string, unknown][] = [];
                names.forEach((n) => {
                  const obj = ifaceByName.get(n);
                  if (obj) pairs.push([obj.id, obj]);
                });
                extendedMap = new Map<string, unknown>(pairs);
              }
              const extendedObj = Object.fromEntries(extendedMap);

              interfaces.set(iface.id, {
                id: iface.id,
                package_id: iface.package_id,
                module_id: iface.module_id,
                name: iface.name,
                created_at: iface.created_at,
                methods: methodsObj,
                properties: propertiesObj,
                extended_interfaces: extendedObj,
              });
            } catch (error) {
              this.logger.error(`Failed to process interface ${iface.id} in module ${mod.id}:`, error);
              // Continue with next interface
            }
          }

          // Load imports for this module
          const imports = new Map<string, unknown>();
          try {
            const importsArray = await this.importRepository.findByModuleId(mod.id);
            for (const imp of importsArray) {
              // load import specifiers for this import
              const specifierDtos = await this.importSpecifierRepository.findByImportId(imp.id);
              const specifiersMap = new Map();
              for (const s of specifierDtos) {
                const uuid = s.id;
                const kind = s.kind;
                const aliases = new Set<string>();
                if (s.alias && s.alias.length > 0) aliases.add(s.alias);
                specifiersMap.set(s.name, {
                  uuid,
                  name: s.name,
                  kind,
                  exportRef: undefined,
                  modules: new Set<string>(),
                  aliases,
                });
              }
              imports.set(imp.id, {
                uuid: imp.id,
                fullPath: imp.source,
                relativePath: imp.source,
                name: imp.source,
                specifiers: specifiersMap,
                depth: 0,
              });
            }
          } catch (error) {
            this.logger.error(`Failed to load imports for module ${mod.id}:`, error);
            // Continue with empty imports
          }

          // Create enriched module
          enrichedModules.push(
            new Module(
              mod.id,
              mod.package_id,
              mod.name,
              mod.source,
              mod.created_at,
              classes as TypeCollection<Class>,
              interfaces as TypeCollection<Interface>,
              imports as TypeCollection<Import>,
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
      this.logger.error('Failed to get modules, returning empty list', error);
      return [];
    }
  }
}
