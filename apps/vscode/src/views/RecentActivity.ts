import * as vscode from 'vscode';

import { SyncStatus } from '../services/VaultIntegrationService';

import type { VaultConfig, VaultIntegrationService } from '../services/VaultIntegrationService';

interface ActivityItem {
  id: string;
  label: string;
  tooltip?: string;
  contextValue?: string;
  timestamp: Date;
  activityType: 'vault-added' | 'vault-synced' | 'file-changed' | 'file-created' | 'file-deleted' | 'tag-applied';
  details?: string;
  filePath?: string;
  vault?: VaultConfig;
}

/**
 * Recent Activity tree data provider
 */
export class RecentActivityProvider implements vscode.TreeDataProvider<ActivityItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ActivityItem | undefined | null>();
  readonly onDidChangeTreeData: vscode.Event<ActivityItem | undefined | null> = this._onDidChangeTreeData.event;

  private activities: ActivityItem[] = [];
  private maxActivities = 50;

  constructor(private vaultService: VaultIntegrationService | undefined = undefined) {
    // Listen for vault and file changes to track activity
    if (this.vaultService) {
      this.vaultService.onVaultChanged((vault) => {
        this.addActivity({
          id: `vault-${Date.now().toString()}`,
          label: `Vault Updated: ${vault.name}`,
          tooltip: `Vault "${vault.name}" was updated\nPath: ${vault.path}\nTime: ${vault.lastSync.toLocaleString()}`,
          contextValue: 'vault-activity',
          timestamp: vault.lastSync,
          activityType: 'vault-synced',
          details: vault.path,
          vault,
        });
      });

      this.vaultService.onFileSynced((syncInfo) => {
        let activityType: ActivityItem['activityType'] = 'file-changed';
        let label = `File Modified: ${syncInfo.relativePath}`;

        const status = syncInfo.status;
        switch (status) {
          case SyncStatus.NewInVault:
            activityType = 'file-created';
            label = `File Created: ${syncInfo.relativePath}`;
            break;
          case SyncStatus.Deleted:
            activityType = 'file-deleted';
            label = `File Deleted: ${syncInfo.relativePath}`;
            break;
          default:
            activityType = 'file-changed';
            label = `File Modified: ${syncInfo.relativePath}`;
        }

        this.addActivity({
          id: `file-${Date.now().toString()}`,
          label,
          tooltip: `${label}\nPath: ${syncInfo.vaultPath}\nTime: ${(syncInfo.lastModifiedVault ?? new Date()).toLocaleString()}`,
          contextValue: 'file-activity',
          timestamp: syncInfo.lastModifiedVault ?? new Date(),
          activityType,
          details: syncInfo.vaultPath,
          filePath: syncInfo.vaultPath,
        });
      });
    }

    // Initial load with placeholder activities
    this.loadInitialActivities();
  }

  public getTreeItem(element: ActivityItem): vscode.TreeItem {
    const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
    item.id = element.id;
    item.tooltip = element.tooltip ?? element.label;
    item.contextValue = element.contextValue ?? '';

    // Set appropriate icons based on activity type
    switch (element.activityType) {
      case 'vault-added':
        item.iconPath = new vscode.ThemeIcon('database');
        break;
      case 'vault-synced':
        item.iconPath = new vscode.ThemeIcon('sync');
        break;
      case 'file-created':
        item.iconPath = new vscode.ThemeIcon('add');
        break;
      case 'file-changed':
        item.iconPath = new vscode.ThemeIcon('edit');
        break;
      case 'file-deleted':
        item.iconPath = new vscode.ThemeIcon('trash');
        break;
      case 'tag-applied':
        item.iconPath = new vscode.ThemeIcon('tag');
        break;
      default:
        item.iconPath = new vscode.ThemeIcon('circle-filled');
    }

    // Add timestamp as description
    const timeDiff = Date.now() - element.timestamp.getTime();
    const minutes = Math.floor(timeDiff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      item.description = `${days.toString()} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      item.description = `${hours.toString()} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      item.description = `${minutes.toString()} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      item.description = 'Just now';
    }

    // Add command for file activities
    if (element.filePath && element.activityType !== 'file-deleted') {
      item.command = {
        command: 'vscode.open',
        title: 'Open File',
        arguments: [vscode.Uri.file(element.filePath)],
      };
    }

    return item;
  }

  public getChildren(): Thenable<ActivityItem[]> {
    // Return all activities sorted by timestamp (most recent first)
    const sortedActivities = [...this.activities].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return Promise.resolve(sortedActivities);
  }

  public addActivity(activity: ActivityItem): void {
    // Add to the beginning of the array
    this.activities.unshift(activity);

    // Limit the number of activities
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(0, this.maxActivities);
    }

    // Fire change event
    this._onDidChangeTreeData.fire(undefined);
  }

  public clearActivities(): void {
    this.activities = [];
    this._onDidChangeTreeData.fire(undefined);
  }

  public loadInitialActivities(): void {
    if (!this.vaultService) {
      // Add placeholder activity
      this.addActivity({
        id: 'welcome',
        label: 'Welcome to Magus Mark',
        tooltip: 'Add an Obsidian vault to start tracking activity',
        contextValue: 'info',
        timestamp: new Date(),
        activityType: 'vault-added',
        details: 'Get started by adding an Obsidian vault',
      });
      return;
    }

    const vaults = this.vaultService.getVaults();

    if (vaults.length === 0) {
      this.addActivity({
        id: 'no-vaults',
        label: 'No vaults configured',
        tooltip: 'Add an Obsidian vault to start tracking activity',
        contextValue: 'info',
        timestamp: new Date(),
        activityType: 'vault-added',
        details: 'Use the command palette to add a vault',
      });
    } else {
      // Add initial activities for existing vaults
      for (const vault of vaults) {
        this.addActivity({
          id: `vault-init-${vault.path}`,
          label: `Vault Connected: ${vault.name}`,
          tooltip: `Vault "${vault.name}" is connected\nPath: ${vault.path}\nLast Sync: ${vault.lastSync.toLocaleString()}`,
          contextValue: 'vault-activity',
          timestamp: vault.lastSync,
          activityType: 'vault-synced',
          details: vault.path,
          vault,
        });
      }
    }
  }
}

/**
 * Register the Recent Activity view
 */
export function registerRecentActivity(
  _context: vscode.ExtensionContext,
  vaultService?: VaultIntegrationService
): vscode.Disposable {
  const provider = new RecentActivityProvider(vaultService);

  const treeView = vscode.window.createTreeView('magusMarkRecentActivity', {
    treeDataProvider: provider,
    showCollapseAll: false,
  });

  // Register activity commands
  const clearActivityCommand = vscode.commands.registerCommand('magus-mark.clearRecentActivity', () => {
    provider.clearActivities();
    vscode.window.showInformationMessage('Recent activity cleared');
  });

  const refreshActivityCommand = vscode.commands.registerCommand('magus-mark.refreshRecentActivity', () => {
    provider.clearActivities();
    // Reload initial activities
    provider.loadInitialActivities();
    vscode.window.showInformationMessage('Recent activity refreshed');
  });

  // Add command to manually add tag activity (for demo purposes)
  const addTagActivityCommand = vscode.commands.registerCommand(
    'magus-mark.addTagActivity',
    (filePath: string, tags: string[]) => {
      provider.addActivity({
        id: `tag-${Date.now().toString()}`,
        label: `Tags Applied: ${tags.join(', ')}`,
        tooltip: `Tags "${tags.join(', ')}" were applied to file\nFile: ${filePath}\nTime: ${new Date().toLocaleString()}`,
        contextValue: 'tag-activity',
        timestamp: new Date(),
        activityType: 'tag-applied',
        details: `Tags: ${tags.join(', ')}`,
        filePath,
      });
    }
  );

  return vscode.Disposable.from(treeView, clearActivityCommand, refreshActivityCommand, addTagActivityCommand);
}
