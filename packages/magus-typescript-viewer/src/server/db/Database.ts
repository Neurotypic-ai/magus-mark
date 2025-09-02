import * as fs from 'fs/promises';
import { join } from 'path';

import { loadSchema } from './schema/schema-loader';

import type { IDatabaseAdapter } from './adapter/IDatabaseAdapter';

export class Database {
  private adapter: IDatabaseAdapter;
  private dbPath: string;

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
        console.log(`Schema verification missing table: ${table}`);
        return false;
      }
    }

    return true;
  }

  public async initializeDatabase(reset = false): Promise<void> {
    console.log('this.dbPath', this.dbPath);
    if (this.dbPath === ':memory:') {
      console.log('initializing in-memory database');
      await this.adapter.init();
      await this.executeSchema(loadSchema());
      return;
    }

    console.log('initializing file-based database');
    const path = join(process.cwd(), this.dbPath);
    console.log('Absolute path being checked:', path);

    let exists = false;
    try {
      const stats = await fs.stat(path);
      console.log('File stats:', {
        size: stats.size,
        isFile: stats.isFile(),
        created: stats.birthtime,
        modified: stats.mtime,
      });
      exists = true;
    } catch (error) {
      console.log('Error checking file:', error);
      exists = false;
    }

    console.log('exists:', exists);
    console.log('reset', reset);

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
      console.log('Loading and executing schema...');
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
