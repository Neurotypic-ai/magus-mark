import { vi } from 'vitest';

import { EventEmitter } from './EventEmitter.mock';

/**
 * Mock for VaultIntegration class
 */
export class VaultIntegration {
  // Event emitters
  private _onVaultChanged = new EventEmitter();
  onVaultChanged = this._onVaultChanged.event;

  private _onFileSynced = new EventEmitter();
  onFileSynced = this._onFileSynced.event;

  // Methods
  initialize = vi.fn().mockResolvedValue(true);
  getVaultPath = vi.fn().mockReturnValue('/test/vault/path');
  listFiles = vi.fn().mockResolvedValue([]);
  readFile = vi.fn().mockResolvedValue('# Test note content');
  writeFile = vi.fn().mockResolvedValue(true);
  deleteFile = vi.fn().mockResolvedValue(true);
  ensureDirectory = vi.fn().mockResolvedValue(true);

  // Simulates a file change event
  triggerFileChange = vi.fn().mockImplementation((path: string) => {
    this._onFileSynced.fire({ path, content: '# Updated content' });
    return true;
  });

  dispose = vi.fn();
}

export default VaultIntegration;
