import { EntityNotFoundError, NoFieldsToUpdateError, RepositoryError } from '../errors/RepositoryError';
import { BaseRepository } from './BaseRepository';

import type { IDatabaseAdapter } from '../adapter/IDatabaseAdapter';
import type { IDatabaseRow } from '../types/DatabaseResults';

/**
 * Data transfer object for creating a new import specifier.
 */
export interface IImportSpecifierCreateDTO {
  /**
   * The unique identifier for the import specifier.
   */
  id: string;

  /**
   * The UUID of the parent import.
   */
  import_id: string;

  /**
   * The name of the imported symbol.
   */
  name: string;

  /**
   * The kind of import (value, type, typeof, default).
   */
  kind: 'value' | 'type' | 'typeof' | 'default';

  /**
   * The alias if imported with a different name (optional).
   */
  alias?: string;
}

/**
 * Repository interface for managing import specifiers.
 */
export interface IImportSpecifierRepository {
  /**
   * Creates a new import specifier.
   */
  create(dto: IImportSpecifierCreateDTO): Promise<IImportSpecifierCreateDTO>;

  /**
   * Creates multiple import specifiers in batch for performance.
   */
  batchCreate(dtos: IImportSpecifierCreateDTO[]): Promise<void>;

  /**
   * Finds an import specifier by its ID.
   */
  findById(id: string): Promise<IImportSpecifierCreateDTO | null>;

  /**
   * Finds all import specifiers for an import.
   */
  findByImportId(importId: string): Promise<IImportSpecifierCreateDTO[]>;

  /**
   * Deletes an import specifier by its ID.
   */
  delete(id: string): Promise<void>;
}

interface IImportSpecifierUpdateDTO {
  name?: string;
  kind?: 'value' | 'type' | 'typeof' | 'default';
  alias?: string;
}

interface IImportSpecifierRow extends IDatabaseRow {
  id: string;
  import_id: string;
  name: string;
  kind: string;
  alias: string | null;
  created_at: string;
}

export class ImportSpecifierRepository
  extends BaseRepository<IImportSpecifierCreateDTO, IImportSpecifierCreateDTO, IImportSpecifierUpdateDTO>
{
  constructor(adapter: IDatabaseAdapter) {
    super(adapter, '[ImportSpecifierRepository]', 'import_specifiers');
  }

  async create(dto: IImportSpecifierCreateDTO): Promise<IImportSpecifierCreateDTO> {
    try {
      const params: (string | null)[] = [dto.id, dto.import_id, dto.name, dto.kind, dto.alias ?? null];

      await this.executeQuery<IImportSpecifierRow>(
        'create',
        `
        INSERT INTO import_specifiers (id, import_id, name, kind, alias)
        VALUES (?, ?, ?, ?, ?)
      `,
        params
      );

      return dto;
    } catch (error) {
      throw new RepositoryError(
        `Failed to create import specifier: ${error instanceof Error ? error.message : String(error)}`,
        'create',
        this.errorTag,
        error instanceof Error ? error : undefined
      );
    }
  }

  async batchCreate(dtos: IImportSpecifierCreateDTO[]): Promise<void> {
    if (dtos.length === 0) return;

    try {
      // DuckDB supports batch inserts efficiently
      for (const dto of dtos) {
        await this.create(dto);
      }
    } catch (error) {
      throw new RepositoryError(
        `Failed to batch create import specifiers: ${error instanceof Error ? error.message : String(error)}`,
        'batchCreate',
        this.errorTag,
        error instanceof Error ? error : undefined
      );
    }
  }

  async update(id: string, dto: IImportSpecifierUpdateDTO): Promise<IImportSpecifierCreateDTO> {
    try {
      const updates: { field: string; value: string }[] = [];

      if (dto.name !== undefined) {
        updates.push({ field: 'name', value: dto.name });
      }

      if (dto.kind !== undefined) {
        updates.push({ field: 'kind', value: dto.kind });
      }

      if (dto.alias !== undefined) {
        updates.push({ field: 'alias', value: dto.alias });
      }

      if (updates.length === 0) {
        throw new NoFieldsToUpdateError('ImportSpecifier', this.errorTag);
      }

      const { query, values } = this.buildUpdateQuery(updates);
      const params = [...values, id];

      await this.executeQuery('update', `UPDATE import_specifiers SET ${query} WHERE id = ?`, params);

      const updated = await this.retrieveById(id);
      if (!updated) {
        throw new EntityNotFoundError('ImportSpecifier', id, this.errorTag);
      }

      return updated;
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }
      throw new RepositoryError(
        `Failed to update import specifier: ${error instanceof Error ? error.message : String(error)}`,
        'update',
        this.errorTag,
        error instanceof Error ? error : undefined
      );
    }
  }

  async retrieveById(id: string): Promise<IImportSpecifierCreateDTO | undefined> {
    try {
      const results = await this.executeQuery<IImportSpecifierRow>(
        'retrieveById',
        'SELECT * FROM import_specifiers WHERE id = ?',
        [id]
      );

      if (results.length === 0) {
        return undefined;
      }

      const row = results[0];
      if (!row) {
        return undefined;
      }

      return this.mapToEntity(row);
    } catch (error) {
      throw new RepositoryError(
        `Failed to retrieve import specifier by id: ${error instanceof Error ? error.message : String(error)}`,
        'retrieveById',
        this.errorTag,
        error instanceof Error ? error : undefined
      );
    }
  }

  async retrieveByImportId(import_id: string): Promise<IImportSpecifierCreateDTO[]> {
    return this.retrieve(undefined, import_id);
  }

  async retrieve(id?: string, import_id?: string): Promise<IImportSpecifierCreateDTO[]> {
    try {
      let query = 'SELECT * FROM import_specifiers';
      const params: string[] = [];

      if (id !== undefined) {
        query += ' WHERE id = ?';
        params.push(id);
      } else if (import_id !== undefined) {
        query += ' WHERE import_id = ?';
        params.push(import_id);
      }

      const results = await this.executeQuery<IImportSpecifierRow>('retrieve', query, params);
      return results.map((row) => this.mapToEntity(row));
    } catch (error) {
      throw new RepositoryError(
        `Failed to retrieve import specifiers: ${error instanceof Error ? error.message : String(error)}`,
        'retrieve',
        this.errorTag,
        error instanceof Error ? error : undefined
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.executeQuery('delete', 'DELETE FROM import_specifiers WHERE id = ?', [id]);
    } catch (error) {
      throw new RepositoryError(
        `Failed to delete import specifier: ${error instanceof Error ? error.message : String(error)}`,
        'delete',
        this.errorTag,
        error instanceof Error ? error : undefined
      );
    }
  }

  async findByImportId(importId: string): Promise<IImportSpecifierCreateDTO[]> {
    return this.retrieveByImportId(importId);
  }

  retrieveByModuleId(_moduleId: string): Promise<IImportSpecifierCreateDTO[]> {
    // Import specifiers don't have a direct module_id reference
    // They're accessed via import_id, which is linked to modules via the imports table
    // This method is required by BaseRepository but not used for import specifiers
    return Promise.resolve([]);
  }

  private mapToEntity(row: IImportSpecifierRow): IImportSpecifierCreateDTO {
    const dto: IImportSpecifierCreateDTO = {
      id: row.id,
      import_id: row.import_id,
      name: row.name,
      kind: row.kind as 'value' | 'type' | 'typeof' | 'default',
    };

    if (row.alias !== null) {
      dto.alias = row.alias;
    }

    return dto;
  }
}
