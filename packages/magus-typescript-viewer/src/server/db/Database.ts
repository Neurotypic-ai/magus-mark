import * as fs from 'fs/promises';
import { join } from 'path';

import { createLogger } from '../../shared/utils/logger';
import { loadSchema } from './schema/schema-loader';

import type { IDatabaseAdapter } from './adapter/IDatabaseAdapter';

const dbLogger = createLogger('Database');

/**
 * Database management class that handles schema initialization and operations.
 * Wraps an IDatabaseAdapter and provides high-level database operations.
 */
export class Database {
  private adapter: IDatabaseAdapter;
  private dbPath: string;

  /**
   * Creates a new Database instance.
   * @param adapter The database adapter to use for operations
   * @param dbPath Path to the database file, or ':memory:' for in-memory database
   */
  constructor(adapter: IDatabaseAdapter, dbPath = ':memory:') {
    this.adapter = adapter;
    this.dbPath = dbPath;
  }

  /**
   * Gets the database adapter instance
   */
  public getAdapter(): IDatabaseAdapter {
    return this.adapter;
  }

  /**
   * Verifies that the database schema exists by checking for the presence of required tables
   */
  private async verifySchema(): Promise<boolean> {
    const requiredTables = [
      'packages',
      'dependencies',
      'modules',
      'classes',
      'interfaces',
      'methods',
      'parameters',
      'properties',
      'imports',
      'class_implements',
      'interface_extends',
      'class_extends',
    ];

    for (const table of requiredTables) {
      try {
        // Check if table exists by selecting 1 row
        await this.adapter.query(`SELECT 1 FROM ${table} LIMIT 1`);
      } catch {
        dbLogger.debug(`Schema verification missing table: ${table}`);
        return false;
      }
    }

    return true;
  }

  public async initializeDatabase(reset = false): Promise<void> {
    dbLogger.debug('Database path:', this.dbPath);
    if (this.dbPath === ':memory:') {
      dbLogger.debug('Initializing in-memory database');
      await this.adapter.init();
      await this.executeSchema(loadSchema());
      return;
    }

    dbLogger.debug('Initializing file-based database');
    const path = join(process.cwd(), this.dbPath);
    dbLogger.debug('Absolute path being checked:', path);

    let exists = false;
    try {
      const stats = await fs.stat(path);
      dbLogger.debug('File stats:', {
        size: stats.size,
        isFile: stats.isFile(),
        created: stats.birthtime,
        modified: stats.mtime,
      });
      exists = true;
    } catch (error) {
      dbLogger.debug('Error checking file:', error);
      exists = false;
    }

    dbLogger.debug('File exists:', exists);
    dbLogger.debug('Reset flag:', reset);

    // Initialize the adapter (this will create a new database)
    await this.adapter.init();

    // For file-based databases, remove the file if it exists and reset is true
    if (exists && reset) {
      await fs.unlink(path);
      exists = false;
    }

    // If the file doesn't exist, or if reset is true, or if schema verification fails,
    // we need to execute the schema
    if (!exists || reset || !(await this.verifySchema())) {
      dbLogger.info('Loading and executing schema...');
      await this.executeSchema(loadSchema());
    }
  }

  /**
   * Splits the SQL schema into individual statements and executes each one sequentially.
   * Note: Assumes that semicolons (;) correctly separate statements in your schema.
   */
  private async executeSchema(sqlScript: string): Promise<void> {
    // Remove lines that start with '--'
    const uncommentedScript = sqlScript
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');

    // Split the uncommented script into individual SQL statements.
    const statements = uncommentedScript
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const stmt of statements) {
      try {
        await this.adapter.query(stmt);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Ignore idempotent errors when tables or indexes already exist
        if (/already exists/i.test(message)) {
          continue;
        }
        throw error;
      }
    }
  }

  public async close(): Promise<void> {
    await this.adapter.close();
  }
}
