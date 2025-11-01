import { RepositoryError } from '../errors/RepositoryError';
import { BaseRepository } from './BaseRepository';

import type { IDatabaseAdapter } from '../adapter/IDatabaseAdapter';
import type { IDatabaseRow } from '../types/DatabaseResults';

export interface IClassImplementsCreateDTO {
  id: string;
  class_id: string;
  interface_id: string;
}

interface IClassImplementsRow extends IDatabaseRow {
  id: string;
  class_id: string;
  interface_id: string;
}

export class ClassImplementsRepository extends BaseRepository<IClassImplementsCreateDTO, IClassImplementsCreateDTO, never> {
  constructor(adapter: IDatabaseAdapter) {
    super(adapter, '[ClassImplementsRepository]', 'class_implements');
  }

  async create(dto: IClassImplementsCreateDTO): Promise<IClassImplementsCreateDTO> {
    try {
      await this.executeQuery<IClassImplementsRow>(
        'create',
        `INSERT INTO class_implements (id, class_id, interface_id) VALUES (?, ?, ?)`,
        [dto.id, dto.class_id, dto.interface_id]
      );
      return dto;
    } catch (error) {
      throw new RepositoryError('Failed to create class_implements relation', 'create', this.errorTag, error as Error);
    }
  }

  // Not needed but required by BaseRepository interface
  async update(id: string, _dto: never): Promise<IClassImplementsCreateDTO> {
    const existing = await this.retrieveById(id);
    if (!existing) throw new RepositoryError('Relation not found', 'update', this.errorTag);
    return existing;
  }

  async retrieveById(id: string): Promise<IClassImplementsCreateDTO | undefined> {
    const rows = await this.executeQuery<IClassImplementsRow>('retrieveById', `SELECT * FROM class_implements WHERE id = ?`, [id]);
    const row = rows[0];
    return row ? { id: row.id, class_id: row.class_id, interface_id: row.interface_id } : undefined;
  }

  async retrieve(id?: string, _module_id?: string): Promise<IClassImplementsCreateDTO[]> {
    if (id) {
      const one = await this.retrieveById(id);
      return one ? [one] : [];
    }
    const rows = await this.executeQuery<IClassImplementsRow>('retrieveAll', `SELECT * FROM class_implements`);
    return rows.map((r) => ({ id: r.id, class_id: r.class_id, interface_id: r.interface_id }));
  }

  async retrieveByModuleId(_module_id: string): Promise<IClassImplementsCreateDTO[]> {
    // class_implements has no module_id; relations are resolved by joining classes/interfaces in higher-level queries
    return [];
  }

  async delete(id: string): Promise<void> {
    await this.executeQuery('delete', 'DELETE FROM class_implements WHERE id = ?', [id]);
  }
}
