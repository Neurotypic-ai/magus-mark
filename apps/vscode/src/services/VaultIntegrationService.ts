import * as fs from 'fs/promises';
import * as path from 'path';

import * as vscode from 'vscode';

import { Result } from '@magus-mark/core/errors/Result';
import { ValidationError } from '@magus-mark/core/errors/ValidationError';
import { toAppError } from '@magus-mark/core/errors/utils';

/**
 * Interface for vault configuration
 */
export interface VaultConfig {
  path: string;
  name: string;
  configVersion: string;
  lastSync: Date;
}

/**
 * Sync status for vault files
 */
export enum SyncStatus {
  InSync = 'in-sync',
  Modified = 'modified',
  NewInVault = 'new-in-vault',
  NewInWorkspace = 'new-in-workspace',
  Conflict = 'conflict',
  Deleted = 'deleted',
}

/**
 * File sync information
 */
export interface FileSyncInfo {
  relativePath: string;
  vaultPath: string;
  workspacePath: string;
  status: SyncStatus;
  lastModifiedVault?: Date;
  lastModifiedWorkspace?: Date;
}

/**
 * Obsidian vault integration service
 * Handles the bidirectional sync between VS Code and Obsidian vaults
 */
export class VaultIntegrationService {
  private readonly _onVaultChanged = new vscode.EventEmitter<VaultConfig>();
  public readonly onVaultChanged: vscode.Event<VaultConfig> = this._onVaultChanged.event;

  private readonly _onFileSynced = new vscode.EventEmitter<FileSyncInfo>();
  public readonly onFileSynced: vscode.Event<FileSyncInfo> = this._onFileSynced.event;

  private vaults: VaultConfig[] = [];
  private syncStatus = new Map<string, FileSyncInfo>();
  private fileWatchers: vscode.FileSystemWatcher[] = [];
  private disposables: vscode.Disposable[] = [];

  constructor(private readonly context: vscode.ExtensionContext) {
    this.disposables.push(this._onVaultChanged, this._onFileSynced);

    // Initialize service
    void this.initialize().catch((error: unknown) => {
      const appError = toAppError(error);
      void vscode.window.showErrorMessage(`Failed to initialize vault service: ${appError.message}`);
    });
  }

  /**
   * Initialize the vault integration service
   */
  private async initialize(): Promise<Result<void>> {
    try {
      this.loadVaults();
      await this.discoverVaults();
      this.setupFileWatchers();
      this.registerCommands();
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(toAppError(error));
    }
  }

  /**
   * Load saved vaults from extension storage
   */
  private loadVaults(): void {
    try {
      const storedVaults = this.context.globalState.get<VaultConfig[]>('vaults', []);
      this.vaults = storedVaults.map((vault) => ({
        ...vault,
        lastSync: new Date(vault.lastSync),
      }));
    } catch {
      // If loading fails, start with empty vaults array
      this.vaults = [];
    }
  }

  /**
   * Save vaults to extension storage
   */
  private async saveVaults(): Promise<Result<void>> {
    try {
      await this.context.globalState.update('vaults', this.vaults);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(toAppError(error));
    }
  }

  /**
   * Discover Obsidian vaults in the workspace
   */
  private async discoverVaults(): Promise<Result<VaultConfig[]>> {
    if (!vscode.workspace.workspaceFolders) {
      return Result.ok([]);
    }

    const discoveredVaults: VaultConfig[] = [];

    try {
      for (const folder of vscode.workspace.workspaceFolders) {
        const result = await this.searchForObsidianVaults(folder.uri.fsPath);
        if (result.isOk()) {
          discoveredVaults.push(...result.getValue());
        }
      }

      // Add newly discovered vaults that aren't already registered
      for (const vault of discoveredVaults) {
        const existingVault = this.vaults.find((v) => v.path === vault.path);
        if (!existingVault) {
          this.vaults.push(vault);
          this._onVaultChanged.fire(vault);
        }
      }

      const saveResult = await this.saveVaults();
      if (saveResult.isFail()) {
        // Log error but don't fail the discovery
        console.warn('Failed to save discovered vaults:', saveResult.getError().message);
      }

      return Result.ok(discoveredVaults);
    } catch (error) {
      return Result.fail(toAppError(error));
    }
  }

  private async searchForObsidianVaults(directory: string): Promise<Result<VaultConfig[]>> {
    const vaults: VaultConfig[] = [];

    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(directory, entry.name);

          // Check if this directory contains .obsidian folder
          const obsidianConfigPath = path.join(fullPath, '.obsidian');
          const hasObsidianConfig = await fs
            .access(obsidianConfigPath)
            .then(() => true)
            .catch(() => false);

          if (hasObsidianConfig) {
            const vault: VaultConfig = {
              path: fullPath,
              name: entry.name,
              configVersion: '1.0.0',
              lastSync: new Date(),
            };
            vaults.push(vault);
          } else {
            // Recursively search subdirectories (but limit depth to avoid infinite recursion)
            const depth = fullPath.split(path.sep).length - directory.split(path.sep).length;
            if (depth < 3) {
              const subResult = await this.searchForObsidianVaults(fullPath);
              if (subResult.isOk()) {
                vaults.push(...subResult.getValue());
              }
            }
          }
        }
      }

      return Result.ok(vaults);
    } catch (error) {
      return Result.fail(toAppError(error));
    }
  }

  /**
   * Setup file watchers for vault files
   */
  private setupFileWatchers(): void {
    // Clean up existing watchers
    this.fileWatchers.forEach((watcher) => {
      watcher.dispose();
    });
    this.fileWatchers = [];

    // Set up watchers for each vault
    this.vaults.forEach((vault) => {
      const pattern = new vscode.RelativePattern(vault.path, '**/*.md');
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);

      watcher.onDidChange((uri) => {
        this.handleFileChange(vault, uri);
      });
      watcher.onDidCreate((uri) => {
        this.handleFileCreation(vault, uri);
      });
      watcher.onDidDelete((uri) => {
        this.handleFileDeletion(vault, uri);
      });

      this.fileWatchers.push(watcher);
      this.disposables.push(watcher);
    });
  }

  /**
   * Register commands related to vault integration
   */
  private registerCommands(): void {
    // Command to manually sync with vault
    const syncCommand = vscode.commands.registerCommand('magus-mark.syncVault', () => {
      this.syncAllVaults();
    });

    // Command to add a vault manually
    const addVaultCommand = vscode.commands.registerCommand('magus-mark.addVault', async () => {
      const folders = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Obsidian Vault',
      });

      if (folders && folders.length > 0 && folders[0]) {
        const folderPath = folders[0].fsPath;
        await this.addVault(folderPath);
      }
    });

    // Command to remove a vault
    const removeVaultCommand = vscode.commands.registerCommand('magus-mark.removeVault', async () => {
      if (this.vaults.length === 0) {
        vscode.window.showInformationMessage('No vaults to remove');
        return;
      }

      const vaultNames = this.vaults.map((v) => v.name);
      const selected = await vscode.window.showQuickPick(vaultNames, {
        placeHolder: 'Select vault to remove',
      });

      if (selected) {
        const vaultIndex = this.vaults.findIndex((v) => v.name === selected);
        if (vaultIndex >= 0) {
          const removedVault = this.vaults[vaultIndex];
          if (removedVault) {
            await this.removeVault(removedVault.path);
          }
        }
      }
    });

    this.disposables.push(syncCommand, addVaultCommand, removeVaultCommand);
  }

  /**
   * Handle file change events
   */
  private handleFileChange(vault: VaultConfig, uri: vscode.Uri): void {
    const relativePath = path.relative(vault.path, uri.fsPath);
    const syncInfo: FileSyncInfo = {
      relativePath,
      vaultPath: uri.fsPath,
      workspacePath: uri.fsPath,
      status: SyncStatus.Modified,
      lastModifiedVault: new Date(),
    };

    this.syncStatus.set(uri.fsPath, syncInfo);
    this._onFileSynced.fire(syncInfo);
  }

  /**
   * Handle file creation events
   */
  private handleFileCreation(vault: VaultConfig, uri: vscode.Uri): void {
    const relativePath = path.relative(vault.path, uri.fsPath);
    const syncInfo: FileSyncInfo = {
      relativePath,
      vaultPath: uri.fsPath,
      workspacePath: uri.fsPath,
      status: SyncStatus.NewInVault,
      lastModifiedVault: new Date(),
    };

    this.syncStatus.set(uri.fsPath, syncInfo);
    this._onFileSynced.fire(syncInfo);
  }

  /**
   * Handle file deletion events
   */
  private handleFileDeletion(vault: VaultConfig, uri: vscode.Uri): void {
    const relativePath = path.relative(vault.path, uri.fsPath);
    const syncInfo: FileSyncInfo = {
      relativePath,
      vaultPath: uri.fsPath,
      workspacePath: uri.fsPath,
      status: SyncStatus.Deleted,
    };

    this.syncStatus.set(uri.fsPath, syncInfo);
    this._onFileSynced.fire(syncInfo);
  }

  /**
   * Sync all vaults
   */
  public syncAllVaults(token?: vscode.CancellationToken): void {
    // Start sync process for all vaults
    this.vaults.forEach((vault) => {
      if (token?.isCancellationRequested) {
        return;
      }
      void this.syncVault(vault.path).catch((error: unknown) => {
        const appError = toAppError(error);
        void vscode.window.showErrorMessage(`Sync failed for ${vault.name}: ${appError.message}`);
      });
    });
  }

  /**
   * Sync a specific vault
   */
  public async syncVault(vaultPath: string): Promise<Result<void>> {
    const vault = this.vaults.find((v) => v.path === vaultPath);
    if (!vault) {
      return Result.fail(new ValidationError('Vault not found', { context: { vaultPath } }));
    }

    try {
      // Update last sync time
      vault.lastSync = new Date();
      const saveResult = await this.saveVaults();

      if (saveResult.isFail()) {
        return saveResult;
      }

      this._onVaultChanged.fire(vault);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(toAppError(error));
    }
  }

  /**
   * Get all registered vaults
   */
  public getVaults(): VaultConfig[] {
    return [...this.vaults];
  }

  /**
   * Get sync status for all files
   */
  public getSyncStatus(): Map<string, FileSyncInfo> {
    return new Map(this.syncStatus);
  }

  /**
   * Add a vault to the configuration
   * @param folderPath Path to the Obsidian vault folder
   * @returns Promise that resolves to true if successful
   */
  public async addVault(folderPath: string): Promise<Result<boolean>> {
    try {
      // Validate the folder path
      const stats = await fs.stat(folderPath);
      if (!stats.isDirectory()) {
        return Result.fail(new ValidationError('Path is not a directory', { context: { folderPath } }));
      }

      // Check if it's already registered
      const existingVault = this.vaults.find((vault) => vault.path === folderPath);
      if (existingVault) {
        return Result.ok(false); // Already exists
      }

      // Check if it has .obsidian folder
      const obsidianConfigPath = path.join(folderPath, '.obsidian');
      const hasObsidianConfig = await fs
        .access(obsidianConfigPath)
        .then(() => true)
        .catch(() => false);

      if (!hasObsidianConfig) {
        return Result.fail(
          new ValidationError('Directory does not contain .obsidian folder', {
            context: { folderPath },
          })
        );
      }

      // Add the vault
      const newVault: VaultConfig = {
        path: folderPath,
        name: path.basename(folderPath),
        configVersion: '1.0.0',
        lastSync: new Date(),
      };

      this.vaults.push(newVault);

      const saveResult = await this.saveVaults();
      if (saveResult.isFail()) {
        // Remove from memory if save failed
        this.vaults = this.vaults.filter((v) => v.path !== folderPath);
        return Result.fail(saveResult.getError());
      }

      this.setupFileWatchers();
      this._onVaultChanged.fire(newVault);

      return Result.ok(true);
    } catch (error) {
      return Result.fail(toAppError(error));
    }
  }

  /**
   * Remove a vault from the configuration
   * @param vaultPath Path to the vault to remove
   * @returns Promise that resolves to true if successful
   */
  public async removeVault(vaultPath: string): Promise<Result<boolean>> {
    const vaultIndex = this.vaults.findIndex((vault) => vault.path === vaultPath);
    if (vaultIndex === -1) {
      return Result.ok(false); // Vault not found
    }

    try {
      // Remove the vault
      const removedVaults = this.vaults.splice(vaultIndex, 1);
      const removedVault = removedVaults[0];

      if (!removedVault) {
        return Result.fail(new ValidationError('Vault not found after removal', { context: { vaultPath } }));
      }

      const saveResult = await this.saveVaults();
      if (saveResult.isFail()) {
        // Restore vault if save failed
        this.vaults.splice(vaultIndex, 0, removedVault);
        return Result.fail(saveResult.getError());
      }

      // Clean up file watchers and sync status
      this.setupFileWatchers();

      // Remove sync status entries for this vault
      const keysToRemove: string[] = [];
      this.syncStatus.forEach((_, key) => {
        if (key.startsWith(vaultPath)) {
          keysToRemove.push(key);
        }
      });
      keysToRemove.forEach((key) => this.syncStatus.delete(key));

      this._onVaultChanged.fire(removedVault);

      return Result.ok(true);
    } catch (error) {
      return Result.fail(toAppError(error));
    }
  }

  /**
   * Apply tags to a document in the vault
   * @param filePath The path to the document
   * @param tags Array of tag names to apply
   * @returns Promise that resolves to true if successful, false otherwise
   */
  public async applyTagsToDocument(filePath: string, tags: string[]): Promise<Result<boolean>> {
    try {
      // Read the file content
      const content = await fs.readFile(filePath, 'utf-8');

      // Parse frontmatter and content
      const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
      const match = frontmatterRegex.exec(content);

      let frontmatter = '';
      let body = content;

      if (match) {
        frontmatter = match[1] ?? '';
        body = match[2] ?? '';
      }

      // Update or add tags in frontmatter
      const lines = frontmatter.split('\n');
      let tagLineIndex = -1;

      // Find existing tags line
      for (let i = 0; i < lines.length; i++) {
        if (lines[i]?.trim().startsWith('tags:')) {
          tagLineIndex = i;
          break;
        }
      }

      // Format tags for YAML
      const tagString = tags.length > 0 ? `tags: [${tags.map((tag) => `"${tag}"`).join(', ')}]` : '';

      if (tagLineIndex >= 0) {
        // Update existing tags line
        if (tagString) {
          lines[tagLineIndex] = tagString;
        } else {
          lines.splice(tagLineIndex, 1);
        }
      } else if (tagString) {
        // Add new tags line
        lines.push(tagString);
      }

      // Reconstruct the file
      const newFrontmatter = lines.filter((line) => line.trim()).join('\n');
      const newContent = newFrontmatter ? `---\n${newFrontmatter}\n---\n${body}` : body;

      // Write back to file
      await fs.writeFile(filePath, newContent, 'utf-8');

      return Result.ok(true);
    } catch (error) {
      return Result.fail(toAppError(error));
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.disposables.forEach((disposable) => {
      disposable.dispose();
    });
    this.fileWatchers.forEach((watcher) => {
      watcher.dispose();
    });
  }
}
