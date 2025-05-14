import { Method } from '../../../shared/types/Method';
import { Parameter } from '../../../shared/types/Parameter';
import { EntityNotFoundError, RepositoryError } from '../errors/RepositoryError';
import { BaseRepository } from './BaseRepository';

import type { DuckDBValue } from '@duckdb/node-api';

import type { VisibilityType } from '../../../shared/types/VisibilityType';
import type { IDatabaseAdapter } from '../adapter/IDatabaseAdapter';
import type { IMethodRow, IParameterRow } from '../types/DatabaseResults';

/**
 * Data transfer object for creating a new method.
 */
export interface IMethodCreateDTO {
  /**
   * The unique identifier for the method.
   */
  id: string;

  /**
   * The UUID of the parent package.
   */
  package_id: string;

  /**
   * The UUID of the parent module.
   */
  module_id: string;

  /**
   * The UUID of the parent class or interface.
   */
  parent_id: string;

  /**
   * The type of the parent (class or interface).
   */
  parent_type: 'class' | 'interface';

  /**
   * The name of the method.
   */
  name: string;

  /**
   * The return type of the method.
   */
  return_type: string;

  /**
   * Whether the method is static.
   */
  is_static: boolean;

  /**
   * Whether the method is async.
   */
  is_async: boolean;

  /**
   * The visibility of the method (public, private, protected).
   */
  visibility: string;
}

export interface IMethodUpdateDTO {
  name?: string;
  return_type?: string;
  parent_type?: 'class' | 'interface';
  is_static?: boolean;
  is_async?: boolean;
  visibility?: string;
}

export class MethodRepository extends BaseRepository<Method, IMethodCreateDTO, IMethodUpdateDTO> {
  constructor(adapter: IDatabaseAdapter) {
    super(adapter, '[MethodRepository]', 'methods');
  }

  async create(dto: IMethodCreateDTO): Promise<Method> {
    try {
      const params: (string | boolean)[] = [
        dto.id,
        dto.package_id,
        dto.module_id,
        dto.parent_id,
        dto.parent_type,
        dto.name,
        dto.return_type,
        dto.is_static,
        dto.is_async,
        dto.visibility,
      ];

      await this.executeQuery<IMethodRow>(
        'create',
        'INSERT INTO methods (id, package_id, module_id, parent_id, parent_type, name, return_type, is_static, is_async, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params
      );

      return new Method(
        dto.id,
        dto.package_id,
        dto.module_id,
        dto.parent_id,
        dto.name,
        new Date(),
        new Map<string, Parameter>(),
        dto.return_type,
        dto.is_static,
        dto.is_async,
        dto.visibility
      );
    } catch (error) {
      this.logger.error('Failed to create method', error);
      throw new RepositoryError('Failed to create method', 'create', this.errorTag, error as Error);
    }
  }

  async update(id: string, dto: IMethodUpdateDTO): Promise<Method> {
    try {
      const updates = [
        { field: 'name', value: (dto.name as DuckDBValue) ?? undefined },
        { field: 'return_type', value: (dto.return_type as DuckDBValue) ?? undefined },
        { field: 'is_static', value: (dto.is_static as DuckDBValue) ?? undefined },
        { field: 'is_async', value: (dto.is_async as DuckDBValue) ?? undefined },
        { field: 'visibility', value: (dto.visibility as DuckDBValue) ?? undefined },
      ] satisfies { field: string; value: DuckDBValue | undefined }[];

      const { query, values } = this.buildUpdateQuery(updates);
      values.push(id);

      await this.executeQuery<IMethodRow>('update', `UPDATE ${this.tableName} SET ${query} WHERE id = ?`, values);

      const result = await this.retrieveById(id);
      if (!result) {
        throw new EntityNotFoundError('Method', id, this.errorTag);
      }
      return result;
    } catch (error) {
      this.logger.error('Failed to update method', error);
      if (error instanceof RepositoryError) {
        throw error;
      }
      throw new RepositoryError('Failed to update method', 'update', String(this.errorTag), error as Error);
    }
  }

  async retrieve(id?: string, module_id?: string): Promise<Method[]> {
    try {
      // Build conditions array for more robust query construction
      const conditions: string[] = [];
      const params: DuckDBValue[] = [];

      if (id !== undefined) {
        conditions.push('m.id = ?');
        params.push(String(id));
      }

      if (module_id !== undefined) {
        conditions.push('m.module_id = ?');
        params.push(String(module_id));
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT m.* 
        FROM methods m
        ${whereClause}
      `
        .trim()
        .replace(/\s+/g, ' ');

      this.logger.debug('Executing retrieve query:', { query, params });

      const results = await this.executeQuery<IMethodRow>('retrieve', query, params);

      return results.map(
        (method) =>
          new Method(
            String(method.id),
            String(method.package_id),
            String(method.module_id),
            String(method.parent_id),
            String(method.name),
            new Date(String(method.created_at)),
            new Map<string, Parameter>(),
            String(method.return_type),
            Boolean(method.is_static),
            Boolean(method.is_async),
            String(method.visibility) as VisibilityType
          )
      );
    } catch (error) {
      this.logger.error('Failed to retrieve method', error);
      throw new RepositoryError('Failed to retrieve method', 'retrieve', this.errorTag, error as Error);
    }
  }

  async retrieveById(id: string): Promise<Method | undefined> {
    const results = await this.retrieve(id);
    return results[0];
  }

  async retrieveByModuleId(module_id: string): Promise<Method[]> {
    return this.retrieve(undefined, module_id);
  }

  async delete(id: string): Promise<void> {
    try {
      // Delete parameters first
      await this.executeQuery<IMethodRow>('delete parameters', 'DELETE FROM parameters WHERE method_id = ?', [id]);

      // Then delete the method
      await this.executeQuery<IMethodRow>('delete method', 'DELETE FROM methods WHERE id = ?', [id]);
    } catch (error) {
      this.logger.error('Failed to delete method', error);
      throw new RepositoryError('Failed to delete method', 'delete', this.errorTag, error as Error);
    }
  }

  async retrieveByParent(parentId: string, parentType: 'class' | 'interface'): Promise<Map<string, Method>> {
    try {
      // Fetch methods with proper parameter handling
      const methods = await this.executeQuery<IMethodRow>(
        'retrieve methods',
        `SELECT m.* FROM methods m 
         WHERE m.parent_id = ? 
         AND m.parent_type = ?`,
        [String(parentId), String(parentType)]
      );

      this.logger.debug(`Found ${String(methods.length)} methods for ${parentType} ${parentId}`);

      if (methods.length === 0) {
        this.logger.debug(`No methods found for ${parentType} ${parentId}`);
        return new Map<string, Method>();
      }

      // Get all method IDs for parameter query
      const methodIds = methods.map((m) => String(m.id));
      const placeholders = methodIds.map(() => '?').join(',');

      // Fetch parameters for all methods in a single query
      const parameters = await this.executeQuery<IParameterRow>(
        'retrieve parameters',
        `SELECT p.* FROM parameters p 
         WHERE p.method_id IN (${placeholders})`,
        methodIds
      );

      this.logger.debug(`Found ${String(parameters.length)} parameters for ${String(methodIds.length)} methods`);

      // Build method map with parameters
      const methodMap = new Map<string, Method>();
      for (const method of methods) {
        const methodParameters = new Map<string, Parameter>();

        // Add parameters to the method
        parameters
          .filter((p) => String(p.method_id) === String(method.id))
          .forEach((p) => {
            methodParameters.set(
              String(p.id),
              new Parameter(
                String(p.id),
                String(p.package_id),
                String(p.module_id),
                String(p.method_id),
                String(p.name),
                new Date(String(p.created_at)),
                String(p.type),
                Boolean(p.is_optional),
                Boolean(p.is_rest),
                p.default_value ? String(p.default_value) : undefined
              )
            );
          });

        // Create method with its parameters
        methodMap.set(
          String(method.id),
          new Method(
            String(method.id),
            String(method.package_id),
            String(method.module_id),
            String(method.parent_id),
            String(method.name),
            new Date(String(method.created_at)),
            methodParameters,
            String(method.return_type),
            Boolean(method.is_static),
            Boolean(method.is_async),
            String(method.visibility) as VisibilityType
          )
        );
      }

      return methodMap;
    } catch (error) {
      this.logger.error('Failed to retrieve methods by parent', error);
      throw new RepositoryError(
        'Failed to retrieve methods by parent',
        'retrieveByParent',
        this.errorTag,
        error as Error
      );
    }
  }
}

/**
 * Repository interface for managing methods.
 */
export interface IMethodRepository {
  /**
   * Creates a new method.
   */
  create(dto: IMethodCreateDTO): Promise<Method>;

  /**
   * Finds a method by its ID.
   */
  findById(id: string): Promise<IMethodCreateDTO | null>;

  /**
   * Finds all methods in a parent (class or interface).
   */
  findByParentId(parentId: string): Promise<IMethodCreateDTO[]>;

  /**
   * Deletes a method by its ID.
   */
  delete(id: string): Promise<void>;
}
