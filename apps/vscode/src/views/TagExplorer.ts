import * as vscode from 'vscode';

import { Result } from '@magus-mark/core/errors/Result';
import { toAppError } from '@magus-mark/core/errors/utils';

import type { VaultIntegrationService } from '../services/VaultIntegrationService';

interface TagTreeItem {
  id: string;
  label: string;
  tooltip?: string;
  contextValue?: string;
  collapsibleState?: vscode.TreeItemCollapsibleState;
  children?: TagTreeItem[];
  usage?: number;
}

/**
 * Tag Explorer tree data provider
 */
export class TagExplorerProvider implements vscode.TreeDataProvider<TagTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TagTreeItem | undefined | null>();
  readonly onDidChangeTreeData: vscode.Event<TagTreeItem | undefined | null> = this._onDidChangeTreeData.event;

  private tags: TagTreeItem[] = [];

  constructor(private vaultService: VaultIntegrationService | undefined = undefined) {
    // Listen for vault changes to refresh tags
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

  public getTreeItem(element: TagTreeItem): vscode.TreeItem {
    const item = new vscode.TreeItem(element.label, element.collapsibleState);
    item.id = element.id;
    item.tooltip = element.tooltip ?? element.label;
    item.contextValue = element.contextValue ?? '';

    if (element.usage !== undefined) {
      item.description = `(${element.usage.toString()})`;
    }

    if (element.children && element.children.length === 0) {
      item.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }

    return item;
  }

  public getChildren(element?: TagTreeItem): Thenable<TagTreeItem[]> {
    if (!element) {
      // Return root items
      return Promise.resolve(this.tags);
    }

    // Return children of the element
    return Promise.resolve(element.children ?? []);
  }

  public async refresh(): Promise<void> {
    const result = await this.loadTags();
    if (result.isOk()) {
      this.tags = result.getValue();
      this._onDidChangeTreeData.fire(undefined);
    } else {
      console.error('Failed to load tags:', result.getError().message);
      this.tags = [
        {
          id: 'error',
          label: 'Error loading tags',
          tooltip: result.getError().message,
          contextValue: 'error',
        },
      ];
      this._onDidChangeTreeData.fire(undefined);
    }
  }

  private async loadTags(): Promise<Result<TagTreeItem[]>> {
    try {
      const tags: TagTreeItem[] = [];

      if (!this.vaultService) {
        // Return some default tags if no vault service
        tags.push({
          id: 'no-vault',
          label: 'No vaults connected',
          tooltip: 'Add an Obsidian vault to see tags',
          contextValue: 'info',
        });
        return Result.ok(tags);
      }

      const vaults = this.vaultService.getVaults();

      if (vaults.length === 0) {
        tags.push({
          id: 'no-vaults',
          label: 'No vaults found',
          tooltip: 'Add an Obsidian vault to see tags',
          contextValue: 'info',
        });
        return Result.ok(tags);
      }

      // Create a section for each vault
      for (const vault of vaults) {
        const vaultTags = await this.scanVaultForTags(vault.path);

        if (vaultTags.isOk() && vaultTags.getValue().length > 0) {
          tags.push({
            id: `vault-${vault.path}`,
            label: vault.name,
            tooltip: `Tags from ${vault.name} (${vault.path})`,
            contextValue: 'vault',
            collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
            children: vaultTags.getValue(),
          });
        } else {
          tags.push({
            id: `vault-${vault.path}`,
            label: `${vault.name} (no tags)`,
            tooltip: `No tags found in ${vault.name}`,
            contextValue: 'vault-empty',
            collapsibleState: vscode.TreeItemCollapsibleState.None,
          });
        }
      }

      return Result.ok(tags);
    } catch (error) {
      return Result.fail(toAppError(error, 'TAG_LOAD_ERROR'));
    }
  }

  private async scanVaultForTags(vaultPath: string): Promise<Result<TagTreeItem[]>> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const tags = new Map<string, number>();

      // Recursively scan for markdown files
      const scanDirectory = async (dir: string): Promise<void> => {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory() && !entry.name.startsWith('.')) {
              await scanDirectory(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.md')) {
              await this.extractTagsFromFile(fullPath, tags);
            }
          }
        } catch (error) {
          // Silently skip directories we can't read
          console.warn(`Could not scan directory ${dir}:`, error);
        }
      };

      await scanDirectory(vaultPath);

      // Convert tags map to tree items
      const tagItems: TagTreeItem[] = Array.from(tags.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([tag, usage]) => ({
          id: `tag-${tag}`,
          label: tag,
          tooltip: `Tag: ${tag} (used ${usage.toString()} times)`,
          contextValue: 'tag',
          usage,
        }));

      return Result.ok(tagItems);
    } catch (error) {
      return Result.fail(toAppError(error, 'VAULT_SCAN_ERROR'));
    }
  }

  private async extractTagsFromFile(filePath: string, tagsMap: Map<string, number>): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');

      // Extract tags from frontmatter
      const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
      const frontmatterMatch = frontmatterRegex.exec(content);

      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1] ?? '';

        // Look for tags in frontmatter
        const tagMatches = /tags:\s*\[(.*?)\]/s.exec(frontmatter);
        if (tagMatches?.[1]) {
          const tags = tagMatches[1]
            .split(',')
            .map((tag) => tag.trim().replace(/['"]/g, ''))
            .filter((tag) => tag.length > 0);

          for (const tag of tags) {
            tagsMap.set(tag, (tagsMap.get(tag) ?? 0) + 1);
          }
        }
      }

      // Also extract inline tags (e.g., #tag)
      const inlineTagMatches = content.match(/#[\w-]+/g);
      if (inlineTagMatches) {
        for (const match of inlineTagMatches) {
          const tag = match.substring(1); // Remove the #
          tagsMap.set(tag, (tagsMap.get(tag) ?? 0) + 1);
        }
      }
    } catch (error) {
      // Silently skip files we can't read
      console.warn(`Could not extract tags from ${filePath}:`, error);
    }
  }
}

/**
 * Register the Tag Explorer view
 */
export function registerTagExplorer(
  _context: vscode.ExtensionContext,
  vaultService?: VaultIntegrationService
): vscode.Disposable {
  const provider = new TagExplorerProvider(vaultService);

  const treeView = vscode.window.createTreeView('magusMarkTagExplorer', {
    treeDataProvider: provider,
    showCollapseAll: true,
    canSelectMany: true,
  });

  // Register tree view commands
  const addTagCommand = vscode.commands.registerCommand('magus-mark.addTag', async () => {
    const tagName = await vscode.window.showInputBox({
      prompt: 'Enter tag name',
      placeHolder: 'my-new-tag',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Tag name cannot be empty';
        }
        if (!/^[\w-]+$/.test(value.trim())) {
          return 'Tag name can only contain letters, numbers, and hyphens';
        }
        return null;
      },
    });

    if (tagName) {
      // TODO: Implement tag creation in core system
      vscode.window.showInformationMessage(`Tag "${tagName.trim()}" will be created`);
    }
  });

  const deleteTagCommand = vscode.commands.registerCommand('magus-mark.deleteTag', async (item: TagTreeItem) => {
    if (item.contextValue === 'tag') {
      const response = await vscode.window.showWarningMessage(
        `Are you sure you want to delete the tag "${item.label}"?`,
        { modal: true },
        'Delete',
        'Cancel'
      );

      if (response === 'Delete') {
        // TODO: Implement tag deletion in core system
        vscode.window.showInformationMessage(`Tag "${item.label}" will be deleted`);
        await provider.refresh();
      }
    }
  });

  const refreshCommand = vscode.commands.registerCommand('magus-mark.refreshTagExplorer', () => {
    void provider.refresh();
  });

  // Set context when tree view is visible
  const updateContext = () => {
    void vscode.commands.executeCommand(
      'setContext',
      'magusMark.hasVaults',
      (vaultService?.getVaults().length ?? 0) > 0
    );
  };

  updateContext();
  if (vaultService) {
    vaultService.onVaultChanged(updateContext);
  }

  return vscode.Disposable.from(treeView, addTagCommand, deleteTagCommand, refreshCommand);
}
