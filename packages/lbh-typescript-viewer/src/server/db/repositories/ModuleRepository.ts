import { Module } from '../../../shared/types/Module';
import { EntityNotFoundError, RepositoryError } from '../errors/RepositoryError';
import { BaseRepository } from './BaseRepository';

import type { DuckDBValue } from '@duckdb/node-api';

import type { FileLocation } from '../../../shared/types/FileLocation';
import type { IDatabaseAdapter } from '../adapter/IDatabaseAdapter';
import type { IModuleRow } from '../types/DatabaseResults';

/**
 * Data transfer object for creating a new module.
 */
export interface IModuleCreateDTO {
  /**
   * The unique identifier for the module.
   */
  id: string;

  /**
   * The UUID of the parent package.
   */
  package_id: string;

  /**
   * The name of the module.
   */
  name: string;

  /**
   * The source location information for this module.
   */
  source: FileLocation;
}

interface IModuleUpdateDTO {
  name?: string;
  source?: FileLocation;
}

/**
 * Repository interface for managing modules.
 */
export interface IModuleRepository {
  /**
   * Creates a new module.
   */
  create(dto: IModuleCreateDTO): Promise<Module>;

  /**
   * Finds a module by its ID.
   */
  findById(id: string): Promise<IModuleCreateDTO | null>;

  /**
   * Finds all modules in a package.
   */
  findByPackageId(packageId: string): Promise<IModuleCreateDTO[]>;

  /**
   * Deletes a module by its ID.
   */
  delete(id: string): Promise<void>;
}

export class ModuleRepository extends BaseRepository<Module, IModuleCreateDTO, IModuleUpdateDTO> {
  constructor(adapter: IDatabaseAdapter) {
    super(adapter, '[ModuleRepository]', 'modules');
  }

  async create(dto: IModuleCreateDTO): Promise<Module> {
    try {
      const results = await this.executeQuery<IModuleRow>(
        'create',
        `INSERT INTO modules (
          id, package_id, name, source
        ) VALUES (?, ?, ?, ?) RETURNING *`,
        [
          dto.id,
          dto.package_id,
          dto.name,
          JSON.stringify(dto.source), // Serialize FileLocation
        ]
      );

      if (results.length === 0) {
        throw new EntityNotFoundError('Module', dto.id, this.errorTag);
      }

      const mod: IModuleRow | undefined = results[0];
      if (!mod) {
        throw new EntityNotFoundError('Module', dto.id, this.errorTag);
      }

      return this.createModuleFromRow(mod);
    } catch (error) {
      this.logger.error('Failed to create module', error);
      throw new RepositoryError('Failed to create module', 'create', this.errorTag, error as Error);
    }
  }

  async update(id: string, dto: IModuleUpdateDTO): Promise<Module> {
    try {
      const updates = [
        { field: 'name', value: (dto.name as DuckDBValue) ?? undefined },
        { field: 'source', value: dto.source ? JSON.stringify(dto.source) : undefined },
      ] satisfies { field: string; value: DuckDBValue | undefined }[];

      const { query, values } = this.buildUpdateQuery(updates);
      values.push(id);

      await this.executeQuery<IModuleRow>('update', `UPDATE ${this.tableName} SET ${query} WHERE id = ?`, values);

      const result = await this.retrieveById(id);

      if (!result) {
        throw new EntityNotFoundError('Module', id, this.errorTag);
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to update module', error);
      if (error instanceof RepositoryError) {
        throw error;
      }
      throw new RepositoryError('Failed to update module', 'update', this.errorTag, error as Error);
    }
  }

  private createModuleFromRow(mod: IModuleRow): Module {
    const source: FileLocation = JSON.parse(mod.source) as FileLocation;
    return new Module(
      String(mod.id),
      String(mod.package_id),
      String(mod.name),
      source,
      new Date(String(mod.created_at)),
      new Map(), // classes
      new Map(), // interfaces
      new Map(), // imports
      new Map(), // exports
      new Map(), // packages
      new Map(), // typeAliases
      new Map(), // enums
      [] // referencePaths
    );
  }

  async retrieve(id?: string, module_id?: string): Promise<Module[]> {
    try {
      let query = 'SELECT * FROM modules';
      const params: DuckDBValue[] = [];
      const conditions: string[] = [];

      if (id !== undefined) {
        conditions.push('id = ?');
        params.push(id);
      }

      if (module_id !== undefined) {
        conditions.push('package_id = ?');
        params.push(module_id);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      const results = await this.executeQuery<IModuleRow>('retrieve', query, params);
      return results.map((mod) => this.createModuleFromRow(mod));
    } catch (error) {
      this.logger.error('Failed to retrieve module', error);
      throw new RepositoryError('Failed to retrieve module', 'retrieve', this.errorTag, error as Error);
    }
  }

  async retrieveById(id: string): Promise<Module | undefined> {
    const results = await this.retrieve(id);
    return results[0];
  }

  async retrieveByModuleId(module_id: string): Promise<Module[]> {
    return this.retrieve(undefined, module_id);
  }

  async retrieveAll(packageId?: string): Promise<Module[]> {
    try {
      const query = packageId ? 'SELECT * FROM modules WHERE package_id = ?' : 'SELECT * FROM modules';
      const params = packageId ? [packageId] : [];

      const results = await this.executeQuery<IModuleRow>('retrieveAll', query, params);
      return results.map((mod) => this.createModuleFromRow(mod));
    } catch (error) {
      this.logger.error('Failed to retrieve all modules', error);
      throw new RepositoryError('Failed to retrieve all modules', 'retrieveAll', this.errorTag, error as Error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Delete related records first
      await this.executeQuery('delete module tests', 'DELETE FROM module_tests WHERE module_id = ?', [id]);
      await this.executeQuery('delete classes', 'DELETE FROM classes WHERE module_id = ?', [id]);
      await this.executeQuery('delete interfaces', 'DELETE FROM interfaces WHERE module_id = ?', [id]);
      await this.executeQuery('delete methods', 'DELETE FROM methods WHERE module_id = ?', [id]);
      await this.executeQuery('delete properties', 'DELETE FROM properties WHERE module_id = ?', [id]);
      await this.executeQuery('delete parameters', 'DELETE FROM parameters WHERE module_id = ?', [id]);
      await this.executeQuery('delete imports', 'DELETE FROM imports WHERE module_id = ?', [id]);

      // Delete the module itself
      await this.executeQuery('delete module', 'DELETE FROM modules WHERE id = ?', [id]);
    } catch (error) {
      this.logger.error('Failed to delete module', error);
      throw new RepositoryError('Failed to delete module', 'delete', this.errorTag, error as Error);
    }
  }
}
