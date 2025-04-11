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
  private syncStatus = new Map<string, FileSyncInfo>();
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
    this.vaults = savedVaults || [];
    
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
   * Handle file creation events
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
   * Handle file deletion events
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
  public async syncAllVaults(token?: vscode.CancellationToken): Promise<void> {
    console.log('Syncing all vaults...');
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Syncing Obsidian vaults...',
      cancellable: true
    }, async (progress, progressToken) => {
      // Use the provided token or the progress token
      const cancellationToken = token || progressToken;
      
      try {
        for (const vault of this.vaults) {
          progress.report({ message: `Syncing ${vault.name}...` });
          if (cancellationToken.isCancellationRequested) {
            break;
          }
          await this.syncVault(vault.path, cancellationToken);
        }
        
        vscode.window.showInformationMessage('All vaults synchronized');
      } catch (error) {
        vscode.window.showErrorMessage(`Error syncing vaults: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Sync a specific vault
   */
  public async syncVault(vaultPath: string, token?: vscode.CancellationToken): Promise<void> {
    const vault = this.vaults.find(v => v.path === vaultPath);
    
    if (!vault) {
      throw new Error(`Vault not found: ${vaultPath}`);
    }
    
    // In a real implementation, this would:
    // 1. Scan vault for markdown files
    // 2. Scan workspace for markdown files
    // 3. Compare and resolve conflicts
    // 4. Sync tags and metadata
    
    // For now, this is just a placeholder
    console.log(`Syncing vault: ${vaultPath}`);
    
    // Simulate sync with a delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update last sync time
    vault.lastSync = new Date();
    await this.saveVaults();
    
    // Notify that the vault was synced
    this._onVaultChanged.fire(vault);
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
  public async addVault(folderPath: string): Promise<boolean> {
    try {
      // Check if it's a valid Obsidian vault
      const obsidianDir = path.join(folderPath, '.obsidian');
      const stats = await fs.promises.stat(obsidianDir);
      
      if (!stats.isDirectory()) {
        throw new Error('Not a valid Obsidian vault');
      }
      
      // Check if vault already exists
      if (this.vaults.some(v => v.path === folderPath)) {
        return false;
      }
      
      // Add the vault
      const vaultName = path.basename(folderPath);
      const newVault: VaultConfig = {
        path: folderPath,
        name: vaultName,
        configVersion: '1.0',
        lastSync: new Date()
      };
      
      this.vaults.push(newVault);
      await this.saveVaults();
      this.setupFileWatchers();
      
      // Notify that a vault was added
      this._onVaultChanged.fire(newVault);
      
      return true;
    } catch (error) {
      console.error('Error adding vault:', error);
      throw error;
    }
  }

  /**
   * Remove a vault from the configuration
   * @param vaultPath Path to the vault to remove
   * @returns Promise that resolves to true if successful
   */
  public async removeVault(vaultPath: string): Promise<boolean> {
    const vaultIndex = this.vaults.findIndex(v => v.path === vaultPath);
    
    if (vaultIndex === -1) {
      return false;
    }
    
    const removedVault = this.vaults[vaultIndex];
    this.vaults.splice(vaultIndex, 1);
    await this.saveVaults();
    this.setupFileWatchers();
    
    // Notify that a vault was removed
    if (removedVault) {
      this._onVaultChanged.fire(removedVault);
    }
    
    return true;
  }

  /**
   * Apply tags to a document in the vault
   * @param filePath The path to the document
   * @param tags Array of tag names to apply
   * @returns Promise that resolves to true if successful, false otherwise
   */
  public async applyTagsToDocument(filePath: string, tags: string[]): Promise<boolean> {
    try {
      // Check if file is in an Obsidian vault
      const matchingVault = this.vaults.find(vault => filePath.startsWith(vault.path));
      
      if (!matchingVault) {
        return false;
      }
      
      // For a simple implementation, we add front matter tags to the file
      // Read file content
      const content = await fs.promises.readFile(filePath, 'utf8');
      
      // Check if file already has front matter
      const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
      const frontMatterMatch = frontMatterRegex.exec(content);
      
      let newContent: string;
      
      if (frontMatterMatch) {
        // File already has front matter, parse it
        const frontMatter = frontMatterMatch[1] || '';
        
        // Check if it already has tags
        const tagRegex = /^tags:\s*(\[.*?\]|\S.*)/m;
        const tagMatch = tagRegex.exec(frontMatter);
        
        if (tagMatch?.[1]) {
          // Extract existing tags
          let existingTags: string[] = [];
          
          // Try to parse as YAML array [tag1, tag2]
          if (tagMatch[1].startsWith('[')) {
            try {
              existingTags = JSON.parse(tagMatch[1].replace(/'/g, '"'));
            } catch {
              // If parsing fails, assume comma-separated values
              existingTags = tagMatch[1].replace(/[\[\]']/g, '').split(',').map(tag => tag.trim());
            }
          } else {
            // Space-separated tags
            existingTags = tagMatch[1].split(/\s+/);
          }
          
          // Merge existing and new tags, ensuring no duplicates
          const mergedTags = [...new Set([...existingTags, ...tags])];
          
          // Replace tags in front matter
          const updatedFrontMatter = frontMatter.replace(
            tagRegex, 
            `tags: [${mergedTags.map(tag => `'${tag}'`).join(', ')}]`
          );
          
          newContent = content.replace(frontMatterMatch[0], `---\n${updatedFrontMatter}\n---\n`);
        } else {
          // No tags in front matter, add them
          const updatedFrontMatter = `${frontMatter}\ntags: [${tags.map(tag => `'${tag}'`).join(', ')}]`;
          newContent = content.replace(frontMatterMatch[0], `---\n${updatedFrontMatter}\n---\n`);
        }
      } else {
        // No front matter, add it
        newContent = `---\ntags: [${tags.map(tag => `'${tag}'`).join(', ')}]\n---\n\n${content}`;
      }
      
      // Write updated content back to file
      await fs.promises.writeFile(filePath, newContent, 'utf8');
      
      // Update sync status if we're tracking this file
      const relativePath = path.relative(matchingVault.path, filePath);
      if (this.syncStatus.has(relativePath)) {
        const syncInfo = this.syncStatus.get(relativePath)!;
        syncInfo.status = SyncStatus.Modified;
        syncInfo.lastModifiedWorkspace = new Date();
        this.syncStatus.set(relativePath, syncInfo);
        this._onFileSynced.fire(syncInfo);
      }
      
      return true;
    } catch (error) {
      console.error('Error applying tags to document:', error);
      return false;
    }
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