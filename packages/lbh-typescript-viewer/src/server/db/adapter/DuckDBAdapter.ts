import type { DuckDBConnection, DuckDBInstance, DuckDBValue } from '@duckdb/node-api';

import type { DatabaseRow, IDatabaseAdapter, QueryParams, QueryResult } from './IDatabaseAdapter';

interface DuckDBTimestampValue {
  micros: bigint | number;
}

function isDuckDBRow(row: unknown): row is unknown[] {
  return Array.isArray(row);
}

function isTimestampValue(value: unknown): value is DuckDBTimestampValue {
  return typeof value === 'object' && value !== null && 'micros' in value;
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof Map) {
    const obj: Record<string, string> = {};
    for (const [k, v] of value.entries()) {
      obj[String(k)] = stringifyValue(v);
    }
    return JSON.stringify(obj);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stringifyValue).join(', ')}]`;
  }
  if (isTimestampValue(value)) {
    const milliseconds = Number(value.micros) / 1000;
    return new Date(milliseconds).toISOString();
  }
  try {
    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj)
      .map(([k, v]) => `${k}:${stringifyValue(v)}`)
      .join(', ');
    return `{${entries}}`;
  } catch {
    return '[Complex Object]';
  }
}

function convertToRow(duckDBRow: unknown, columnNames: string[]): DatabaseRow {
  if (!isDuckDBRow(duckDBRow)) {
    throw new Error('Invalid row format from DuckDB');
  }

  // DuckDB returns rows as arrays, with column names in the metadata
  const id = duckDBRow[0];
  if (id === undefined || id === null) {
    throw new Error('Row is missing required id field');
  }

  return {
    id: stringifyValue(id),
    ...Object.fromEntries(
      duckDBRow
        .slice(1)
        .map((value, index) => [
          columnNames[index + 1] || `column_${(index + 1).toString()}`,
          value !== null ? stringifyValue(value) : null,
        ])
    ),
  };
}

export class DuckDBAdapter implements IDatabaseAdapter {
  private db!: DuckDBInstance;
  private connection!: DuckDBConnection;
  private isInitialized = false;

  constructor(
    private readonly dbPath: string,
    private readonly config?: { allowWrite?: boolean; threads?: number }
  ) {}

  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const duckdb = await import('@duckdb/node-api');

    // Create instance with optimized settings
    this.db = await duckdb.DuckDBInstance.create(this.dbPath, {
      access_mode: this.config?.allowWrite ? 'READ_WRITE' : 'READ_ONLY',
      threads: this.config?.threads ? this.config.threads.toString() : '8', // Increased default threads
    });

    this.connection = await this.db.connect();
    this.isInitialized = true;
  }

  getDbPath(): string {
    return this.dbPath;
  }

  async query<T extends DatabaseRow = DatabaseRow>(sql: string, params?: QueryParams): Promise<QueryResult<T>> {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call init() first.');
    }

    try {
      const result = await this.connection.runAndReadAll(sql, params as DuckDBValue[]);
      if (typeof result.columnNames !== 'function' || typeof result.getRows !== 'function') {
        throw new Error('Invalid result from DuckDB query');
      }

      const columnNames = result.columnNames();
      const rows = result.getRows();
      if (!Array.isArray(rows)) {
        throw new Error('Invalid rows format from DuckDB query');
      }

      return rows.map((row: unknown) => convertToRow(row, columnNames)) as T[];
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  async close(): Promise<void> {
    if (this.isInitialized) {
      this.connection.disconnect();
      await Promise.resolve(); // Ensure we complete any pending operations
      this.isInitialized = false;
    }
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call init() first.');
    }

    await this.connection.run('BEGIN TRANSACTION');
    try {
      const result = await callback();
      await this.connection.run('COMMIT');
      return result;
    } catch (error) {
      await this.connection.run('ROLLBACK');
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
}
