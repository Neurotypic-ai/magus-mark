import { RepositoryError } from '../errors/RepositoryError';
import { BaseRepository } from './BaseRepository';

import type { IDatabaseAdapter } from '../adapter/IDatabaseAdapter';
import type { IDatabaseRow } from '../types/DatabaseResults';

export interface IInterfaceExtendsCreateDTO {
  id: string;
  interface_id: string;
  extended_id: string;
}

interface IInterfaceExtendsRow extends IDatabaseRow {
  id: string;
  interface_id: string;
  extended_id: string;
}

export class InterfaceExtendsRepository extends BaseRepository<IInterfaceExtendsCreateDTO, IInterfaceExtendsCreateDTO, never> {
  constructor(adapter: IDatabaseAdapter) {
    super(adapter, '[InterfaceExtendsRepository]', 'interface_extends');
  }

  async create(dto: IInterfaceExtendsCreateDTO): Promise<IInterfaceExtendsCreateDTO> {
    try {
      await this.executeQuery<IInterfaceExtendsRow>(
        'create',
        `INSERT INTO interface_extends (id, interface_id, extended_id) VALUES (?, ?, ?)`,
        [dto.id, dto.interface_id, dto.extended_id]
      );
      return dto;
    } catch (error) {
      throw new RepositoryError('Failed to create interface_extends relation', 'create', this.errorTag, error as Error);
    }
  }

  // Not needed but required by BaseRepository interface
  async update(id: string, _dto: never): Promise<IInterfaceExtendsCreateDTO> {
    const existing = await this.retrieveById(id);
    if (!existing) throw new RepositoryError('Relation not found', 'update', this.errorTag);
    return existing;
  }

  async retrieveById(id: string): Promise<IInterfaceExtendsCreateDTO | undefined> {
    const rows = await this.executeQuery<IInterfaceExtendsRow>('retrieveById', `SELECT * FROM interface_extends WHERE id = ?`, [id]);
    const row = rows[0];
    return row ? { id: row.id, interface_id: row.interface_id, extended_id: row.extended_id } : undefined;
  }

  async retrieve(id?: string, _module_id?: string): Promise<IInterfaceExtendsCreateDTO[]> {
    if (id) {
      const one = await this.retrieveById(id);
      return one ? [one] : [];
    }
    const rows = await this.executeQuery<IInterfaceExtendsRow>('retrieveAll', `SELECT * FROM interface_extends`);
    return rows.map((r) => ({ id: r.id, interface_id: r.interface_id, extended_id: r.extended_id }));
  }

  async retrieveByModuleId(_module_id: string): Promise<IInterfaceExtendsCreateDTO[]> {
    // interface_extends has no module_id; relations are resolved by joining interfaces in higher-level queries
    return [];
  }

  async delete(id: string): Promise<void> {
    await this.executeQuery('delete', 'DELETE FROM interface_extends WHERE id = ?', [id]);
  }
}
