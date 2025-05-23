import * as vscode from 'vscode';

import { Result } from '@magus-mark/core/errors/Result';
import { toAppError } from '@magus-mark/core/errors/utils';

import { SyncStatus } from '../services/VaultIntegrationService';

import type { FileSyncInfo, VaultConfig, VaultIntegrationService } from '../services/VaultIntegrationService';

interface VaultTreeItem {
  id: string;
  label: string;
  tooltip?: string;
  contextValue?: string;
  collapsibleState?: vscode.TreeItemCollapsibleState;
  children?: VaultTreeItem[];
  vault?: VaultConfig;
  syncInfo?: FileSyncInfo;
}

/**
 * Vault Browser tree data provider
 */
export class VaultBrowserProvider implements vscode.TreeDataProvider<VaultTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<VaultTreeItem | undefined | null>();
  readonly onDidChangeTreeData: vscode.Event<VaultTreeItem | undefined | null> = this._onDidChangeTreeData.event;

  private vaultItems: VaultTreeItem[] = [];

  constructor(private vaultService: VaultIntegrationService | undefined = undefined) {
    // Listen for vault changes to refresh view
    if (this.vaultService) {
      this.vaultService.onVaultChanged(() => {
        void this.refresh();
      });

      this.vaultService.onFileSynced(() => {
        void this.refresh();
      });
    }

    // Initial load
    void this.refresh();
  }

  public getTreeItem(element: VaultTreeItem): vscode.TreeItem {
    const item = new vscode.TreeItem(element.label, element.collapsibleState);
    item.id = element.id;
    item.tooltip = element.tooltip ?? element.label;
    item.contextValue = element.contextValue ?? '';

    // Set appropriate icons
    if (element.contextValue === 'vault') {
      item.iconPath = new vscode.ThemeIcon('database');
    } else if (element.contextValue === 'file') {
      item.iconPath = new vscode.ThemeIcon('file');
      // Set command to open file
      if (element.syncInfo?.vaultPath) {
        item.command = {
          command: 'vscode.open',
          title: 'Open File',
          arguments: [vscode.Uri.file(element.syncInfo.vaultPath)],
        };
      }
    } else if (element.contextValue === 'folder') {
      item.iconPath = new vscode.ThemeIcon('folder');
    }

    // Add status indicators for sync
    if (element.syncInfo) {
      const status = element.syncInfo.status;
      switch (status) {
        case SyncStatus.Modified:
          item.description = '$(circle-filled) Modified';
          break;
        case SyncStatus.NewInVault:
          item.description = '$(add) New';
          break;
        case SyncStatus.Conflict:
          item.description = '$(warning) Conflict';
          break;
        case SyncStatus.Deleted:
          item.description = '$(trash) Deleted';
          break;
        default:
          item.description = '$(check) In Sync';
      }
    }

    return item;
  }

  public getChildren(element?: VaultTreeItem): Thenable<VaultTreeItem[]> {
    if (!element) {
      // Return root items (vaults)
      return Promise.resolve(this.vaultItems);
    }

    // Return children of the element
    return Promise.resolve(element.children ?? []);
  }

  public async refresh(): Promise<void> {
    const result = await this.loadVaults();
    if (result.isOk()) {
      this.vaultItems = result.getValue();
      this._onDidChangeTreeData.fire(undefined);
    } else {
      console.error('Failed to load vaults:', result.getError().message);
      this.vaultItems = [
        {
          id: 'error',
          label: 'Error loading vaults',
          tooltip: result.getError().message,
          contextValue: 'error',
        },
      ];
      this._onDidChangeTreeData.fire(undefined);
    }
  }

  private async loadVaults(): Promise<Result<VaultTreeItem[]>> {
    try {
      const vaultItems: VaultTreeItem[] = [];

      if (!this.vaultService) {
        vaultItems.push({
          id: 'no-service',
          label: 'Vault service not available',
          tooltip: 'Vault integration service is not initialized',
          contextValue: 'info',
        });
        return Result.ok(vaultItems);
      }

      const vaults = this.vaultService.getVaults();

      if (vaults.length === 0) {
        vaultItems.push({
          id: 'no-vaults',
          label: 'No vaults configured',
          tooltip: 'Add an Obsidian vault to get started',
          contextValue: 'info',
        });
        return Result.ok(vaultItems);
      }

      // Create vault items
      for (const vault of vaults) {
        const vaultItem: VaultTreeItem = {
          id: `vault-${vault.path}`,
          label: vault.name,
          tooltip: `${vault.name}\nPath: ${vault.path}\nLast Sync: ${vault.lastSync.toLocaleString()}`,
          contextValue: 'vault',
          collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
          vault,
          children: [],
        };

        // Load recent files and sync status
        const recentFiles = await this.loadRecentFiles(vault);
        if (recentFiles.isOk()) {
          vaultItem.children = recentFiles.getValue();
          if (recentFiles.getValue().length > 0) {
            vaultItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
          }
        }

        vaultItems.push(vaultItem);
      }

      return Result.ok(vaultItems);
    } catch (error) {
      return Result.fail(toAppError(error, 'VAULT_LOAD_ERROR'));
    }
  }

  private async loadRecentFiles(vault: VaultConfig): Promise<Result<VaultTreeItem[]>> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      const fileItems: VaultTreeItem[] = [];
      const syncStatus = this.vaultService?.getSyncStatus() ?? new Map();

      // Get recent markdown files (limit to 10 for performance)
      const getRecentFiles = async (
        dir: string,
        files: { path: string; mtime: Date }[] = []
      ): Promise<{ path: string; mtime: Date }[]> => {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory() && !entry.name.startsWith('.')) {
              // Recursively check subdirectories (but limit depth)
              const depth = fullPath.split(path.sep).length - vault.path.split(path.sep).length;
              if (depth < 3) {
                await getRecentFiles(fullPath, files);
              }
            } else if (entry.isFile() && entry.name.endsWith('.md')) {
              const stats = await fs.stat(fullPath);
              files.push({
                path: fullPath,
                mtime: stats.mtime,
              });
            }
          }
        } catch (error) {
          // Skip directories we can't read
          console.warn(`Could not read directory ${dir}:`, error);
        }

        return files;
      };

      const allFiles = await getRecentFiles(vault.path);

      // Sort by modification time and take the 10 most recent
      const recentFiles = allFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime()).slice(0, 10);

      for (const file of recentFiles) {
        const relativePath = path.relative(vault.path, file.path);
        const fileName = path.basename(file.path);
        const syncInfo = syncStatus.get(file.path) as FileSyncInfo | undefined;

        fileItems.push({
          id: `file-${file.path}`,
          label: fileName,
          tooltip: `${relativePath}\nModified: ${file.mtime.toLocaleString()}`,
          contextValue: 'file',
          ...(syncInfo && { syncInfo }),
        });
      }

      return Result.ok(fileItems);
    } catch (error) {
      return Result.fail(toAppError(error, 'RECENT_FILES_LOAD_ERROR'));
    }
  }
}

/**
 * Register the Vault Browser view
 */
export function registerVaultBrowser(
  _context: vscode.ExtensionContext,
  vaultService?: VaultIntegrationService
): vscode.Disposable {
  const provider = new VaultBrowserProvider(vaultService);

  const treeView = vscode.window.createTreeView('magusMarkVaultBrowser', {
    treeDataProvider: provider,
    showCollapseAll: true,
  });

  // Register vault browser commands
  const openVaultCommand = vscode.commands.registerCommand('magus-mark.openVault', async (item: VaultTreeItem) => {
    if (item.vault) {
      // Open vault folder in VS Code
      const uri = vscode.Uri.file(item.vault.path);
      await vscode.commands.executeCommand('revealFileInOS', uri);
    }
  });

  const syncVaultCommand = vscode.commands.registerCommand(
    'magus-mark.syncSelectedVault',
    async (item: VaultTreeItem) => {
      if (item.vault && vaultService) {
        const result = await vaultService.syncVault(item.vault.path);
        if (result.isOk()) {
          vscode.window.showInformationMessage(`Vault "${item.vault.name}" synchronized successfully`);
          await provider.refresh();
        } else {
          vscode.window.showErrorMessage(`Failed to sync vault: ${result.getError().message}`);
        }
      }
    }
  );

  const refreshVaultBrowserCommand = vscode.commands.registerCommand('magus-mark.refreshVaultBrowser', () => {
    void provider.refresh();
  });

  return vscode.Disposable.from(treeView, openVaultCommand, syncVaultCommand, refreshVaultBrowserCommand);
}
