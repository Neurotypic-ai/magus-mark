import { vi } from 'vitest';

import { EventEmitter } from './EventEmitter.mock';

/**
 * Mock for VaultIntegration class
 */
export class VaultIntegration {
  // Event emitters
  private _onVaultChanged = new EventEmitter();
  onVaultChanged: typeof this._onVaultChanged.event;

  private _onFileSynced = new EventEmitter();
  onFileSynced: typeof this._onFileSynced.event;

  constructor() {
    this.onVaultChanged = this._onVaultChanged.event.bind(this);
    this.onFileSynced = this._onFileSynced.event.bind(this);
  }

  // Methods
  initialize: typeof vi.fn = vi.fn().mockResolvedValue(true);
  getVaultPath: typeof vi.fn = vi.fn().mockReturnValue('/test/vault/path');
  listFiles: typeof vi.fn = vi.fn().mockResolvedValue([]);
  readFile: typeof vi.fn = vi.fn().mockResolvedValue('# Test note content');
  writeFile: typeof vi.fn = vi.fn().mockResolvedValue(true);
  deleteFile: typeof vi.fn = vi.fn().mockResolvedValue(true);
  ensureDirectory: typeof vi.fn = vi.fn().mockResolvedValue(true);

  // Simulates a file change event
  triggerFileChange: typeof vi.fn = vi.fn().mockImplementation((path: string) => {
    this._onFileSynced.fire({ path, content: '# Updated content' });
    return true;
  });

  dispose: typeof vi.fn = vi.fn();
}

export default VaultIntegration;
