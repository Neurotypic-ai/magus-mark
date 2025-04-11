import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

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
  Deleted = 'deleted'
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
  public readonly onVaultChanged = this._onVaultChanged.event;
  
  private readonly _onFileSynced = new vscode.EventEmitter<FileSyncInfo>();
  public readonly onFileSynced = this._onFileSynced.event;
  
  private vaults: VaultConfig[] = [];
  private syncStatus: Map<string, FileSyncInfo> = new Map();
  private fileWatchers: vscode.FileSystemWatcher[] = [];
  private disposables: vscode.Disposable[] = [];

  constructor(private readonly context: vscode.ExtensionContext) {
    this.initialize();
  }

  /**
   * Initialize the vault integration service
   */
  private async initialize(): Promise<void> {
    // Load saved vaults from storage
    await this.loadVaults();
    
    // Discover vaults in workspace
    await this.discoverVaults();
    
    // Set up file watchers
    this.setupFileWatchers();
    
    // Register commands
    this.registerCommands();
  }

  /**
   * Load saved vaults from extension storage
   */
  private async loadVaults(): Promise<void> {
    const savedVaults = this.context.globalState.get<VaultConfig[]>('obsidianMagic.vaults', []);
    this.vaults = savedVaults;
    
    console.log(`Loaded ${this.vaults.length} saved vaults`);
  }

  /**
   * Save vaults to extension storage
   */
  private async saveVaults(): Promise<void> {
    await this.context.globalState.update('obsidianMagic.vaults', this.vaults);
  }

  /**
   * Discover Obsidian vaults in the workspace
   */
  private async discoverVaults(): Promise<void> {
    if (!vscode.workspace.workspaceFolders) {
      return;
    }
    
    for (const folder of vscode.workspace.workspaceFolders) {
      const obsidianDir = path.join(folder.uri.fsPath, '.obsidian');
      
      try {
        const stats = await fs.promises.stat(obsidianDir);
        if (stats.isDirectory()) {
          // Found an Obsidian vault
          try {
            // Check for vault config file
            const configPath = path.join(obsidianDir, 'app.json');
            const configExists = await fs.promises.access(configPath)
              .then(() => true)
              .catch(() => false);
            
            if (configExists) {
              const configData = await fs.promises.readFile(configPath, 'utf8');
              const config = JSON.parse(configData);
              
              // Add vault if not already known
              if (!this.vaults.some(v => v.path === folder.uri.fsPath)) {
                const vault: VaultConfig = {
                  path: folder.uri.fsPath,
                  name: folder.name,
                  configVersion: config.configVersion || '0',
                  lastSync: new Date()
                };
                
                this.vaults.push(vault);
                this._onVaultChanged.fire(vault);
                
                await this.saveVaults();
                
                vscode.window.showInformationMessage(`Discovered Obsidian vault: ${vault.name}`);
              }
            }
          } catch (err) {
            console.error(`Error reading Obsidian vault config: ${err}`);
          }
        }
      } catch (err) {
        // Not an Obsidian vault, or can't access
      }
    }
  }

  /**
   * Setup file watchers for vault files
   */
  private setupFileWatchers(): void {
    // Dispose any existing watchers
    for (const watcher of this.fileWatchers) {
      watcher.dispose();
    }
    this.fileWatchers = [];
    
    // Create new watchers for each vault
    for (const vault of this.vaults) {
      const markdownPattern = new vscode.RelativePattern(vault.path, '**/*.md');
      const watcher = vscode.workspace.createFileSystemWatcher(markdownPattern);
      
      // Handle file changes
      watcher.onDidChange(async uri => {
        await this.handleFileChange(vault, uri);
      });
      
      // Handle file creation
      watcher.onDidCreate(async uri => {
        await this.handleFileCreation(vault, uri);
      });
      
      // Handle file deletion
      watcher.onDidDelete(async uri => {
        await this.handleFileDeletion(vault, uri);
      });
      
      this.fileWatchers.push(watcher);
      this.disposables.push(watcher);
    }
  }

  /**
   * Register commands related to vault integration
   */
  private registerCommands(): void {
    // Command to manually sync with vault
    const syncCommand = vscode.commands.registerCommand('obsidian-magic.syncVault', async () => {
      await this.syncAllVaults();
    });
    
    // Command to add a vault manually
    const addVaultCommand = vscode.commands.registerCommand('obsidian-magic.addVault', async () => {
      const folders = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Obsidian Vault'
      });
      
      if (folders && folders.length > 0 && folders[0]) {
        const folderPath = folders[0].fsPath;
        await this.addVault(folderPath);
      }
    });
    
    // Command to remove a vault
    const removeVaultCommand = vscode.commands.registerCommand('obsidian-magic.removeVault', async () => {
      if (this.vaults.length === 0) {
        vscode.window.showInformationMessage('No vaults to remove');
        return;
      }
      
      const vaultNames = this.vaults.map(v => v.name);
      const selected = await vscode.window.showQuickPick(vaultNames, {
        placeHolder: 'Select vault to remove'
      });
      
      if (selected) {
        const vaultIndex = this.vaults.findIndex(v => v.name === selected);
        if (vaultIndex >= 0) {
          this.vaults.splice(vaultIndex, 1);
          await this.saveVaults();
          this.setupFileWatchers();
          vscode.window.showInformationMessage(`Removed vault: ${selected}`);
        }
      }
    });
    
    this.disposables.push(syncCommand, addVaultCommand, removeVaultCommand);
  }

  /**
   * Add a vault manually
   */
  private async addVault(folderPath: string): Promise<void> {
    const obsidianDir = path.join(folderPath, '.obsidian');
    
    try {
      // Check if it's a valid Obsidian vault
      const stats = await fs.promises.stat(obsidianDir);
      if (!stats.isDirectory()) {
        vscode.window.showErrorMessage('Not a valid Obsidian vault');
        return;
      }
      
      // Check if vault already exists
      if (this.vaults.some(v => v.path === folderPath)) {
        vscode.window.showInformationMessage('Vault already added');
        return;
      }
      
      // Add the vault
      const folderName = path.basename(folderPath);
      const vault: VaultConfig = {
        path: folderPath,
        name: folderName,
        configVersion: '0',
        lastSync: new Date()
      };
      
      this.vaults.push(vault);
      this._onVaultChanged.fire(vault);
      
      await this.saveVaults();
      this.setupFileWatchers();
      
      vscode.window.showInformationMessage(`Added vault: ${folderName}`);
    } catch (err) {
      vscode.window.showErrorMessage(`Error adding vault: ${String(err)}`);
    }
  }

  /**
   * Handle file change in vault
   */
  private async handleFileChange(vault: VaultConfig, uri: vscode.Uri): Promise<void> {
    const relativePath = path.relative(vault.path, uri.fsPath);
    
    // Update sync status
    const syncInfo: FileSyncInfo = {
      relativePath,
      vaultPath: uri.fsPath,
      workspacePath: uri.fsPath,
      status: SyncStatus.Modified,
      lastModifiedWorkspace: new Date()
    };
    
    this.syncStatus.set(relativePath, syncInfo);
    this._onFileSynced.fire(syncInfo);
    
    console.log(`File changed: ${relativePath}`);
  }

  /**
   * Handle file creation in vault
   */
  private async handleFileCreation(vault: VaultConfig, uri: vscode.Uri): Promise<void> {
    const relativePath = path.relative(vault.path, uri.fsPath);
    
    // Update sync status
    const syncInfo: FileSyncInfo = {
      relativePath,
      vaultPath: uri.fsPath,
      workspacePath: uri.fsPath,
      status: SyncStatus.NewInWorkspace,
      lastModifiedWorkspace: new Date()
    };
    
    this.syncStatus.set(relativePath, syncInfo);
    this._onFileSynced.fire(syncInfo);
    
    console.log(`File created: ${relativePath}`);
  }

  /**
   * Handle file deletion in vault
   */
  private async handleFileDeletion(vault: VaultConfig, uri: vscode.Uri): Promise<void> {
    const relativePath = path.relative(vault.path, uri.fsPath);
    
    // Update sync status
    const syncInfo: FileSyncInfo = {
      relativePath,
      vaultPath: uri.fsPath,
      workspacePath: uri.fsPath,
      status: SyncStatus.Deleted
    };
    
    this.syncStatus.set(relativePath, syncInfo);
    this._onFileSynced.fire(syncInfo);
    
    console.log(`File deleted: ${relativePath}`);
  }

  /**
   * Sync all vaults
   */
  private async syncAllVaults(): Promise<void> {
    if (this.vaults.length === 0) {
      vscode.window.showInformationMessage('No vaults to sync');
      return;
    }
    
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Syncing Obsidian vaults',
      cancellable: false
    }, async (progress) => {
      for (const vault of this.vaults) {
        progress.report({ message: `Syncing ${vault.name}...` });
        await this.syncVault(vault);
        vault.lastSync = new Date();
      }
      
      await this.saveVaults();
      vscode.window.showInformationMessage('Vault sync completed');
    });
  }

  /**
   * Sync a specific vault
   */
  private async syncVault(vault: VaultConfig): Promise<void> {
    // In a real implementation, this would:
    // 1. Scan vault for markdown files
    // 2. Compare with workspace files
    // 3. Determine sync status for each file
    // 4. Sync files based on status
    // 5. Resolve conflicts if needed
    
    // For now, this is just a placeholder
    console.log(`Syncing vault: ${vault.name}`);
    
    // Simulate sync with a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
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
   * Dispose resources
   */
  public dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    
    for (const watcher of this.fileWatchers) {
      watcher.dispose();
    }
    
    this.disposables = [];
    this.fileWatchers = [];
  }
} 