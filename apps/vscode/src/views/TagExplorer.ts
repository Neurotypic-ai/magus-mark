import * as vscode from 'vscode';

import { initializeCore } from '@obsidian-magic/core';

import type { TaxonomyManager } from '@obsidian-magic/core/tagging/TaxonomyManager';

// Tag node representation for the tree view
export interface TagNode {
  id: string;
  name: string;
  description?: string | undefined;
  children: TagNode[];
  type: 'domain' | 'subdomain' | 'tag';
  count: number;
}

/**
 * TagExplorer class - Provides a tree data provider for the Obsidian Magic tag explorer
 */
export class TagExplorer implements vscode.TreeDataProvider<TagNode>, vscode.Disposable {
  private _onDidChangeTreeData: vscode.EventEmitter<TagNode | undefined | null> = new vscode.EventEmitter<
    TagNode | undefined | null
  >();
  readonly onDidChangeTreeData: vscode.Event<TagNode | undefined | null> = this._onDidChangeTreeData.event;

  private tags: TagNode[] = [];
  private disposables: vscode.Disposable[] = [];
  private taxonomyManager: TaxonomyManager;

  /**
   * Creates a new TagExplorer instance
   * @param context The extension context
   * @param taxonomyManager The taxonomy manager instance
   */
  constructor(_context: vscode.ExtensionContext, taxonomyManager: TaxonomyManager) {
    this.taxonomyManager = taxonomyManager;

    // Load initial tag data
    void this.loadTagData().catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      void vscode.window.showErrorMessage(`Failed to initialize tag explorer: ${errorMessage}`);
    });

    // Register for events that might change tag data
    this.registerEventHandlers();

    // Set up event listener for taxonomy changes if supported
    const manager = this.taxonomyManager as unknown as { onChange?: (callback: () => void) => void };
    if (typeof manager.onChange === 'function') {
      manager.onChange(() => {
        void this.loadTagData().catch((error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          void vscode.window.showErrorMessage(`Failed to refresh tags: ${errorMessage}`);
        });
      });
    }
  }

  /**
   * Gets the parent of a node (not implemented)
   * @param element The element to find the parent of
   */
  getParent?(element: TagNode): vscode.ProviderResult<TagNode> {
    // For root level nodes, return null
    if (!element.id.includes('.')) {
      return null;
    }

    // Get the parent ID from the element's ID (everything before the last dot)
    const parentId = element.id.split('.').slice(0, -1).join('.');

    // Find the parent node by traversing the tag tree
    const findParent = (nodes: TagNode[]): TagNode | null => {
      for (const node of nodes) {
        if (node.id === parentId) {
          return node;
        }
        if (node.children.length > 0) {
          const found = findParent(node.children);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };

    return findParent(this.tags);
  }

  /**
   * Resolves a tree item (not implemented)
   * @param item The tree item to resolve
   * @param element The associated element
   * @param token Cancellation token
   */
  resolveTreeItem?(
    item: vscode.TreeItem,
    element: TagNode,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.TreeItem> {
    // Return early if cancelled
    if (token.isCancellationRequested) {
      return null;
    }

    // Enhance the tree item with additional details
    item.tooltip = new vscode.MarkdownString();
    item.tooltip.isTrusted = true;
    item.tooltip.supportHtml = true;

    // Build rich tooltip content
    const tooltipContent = [
      `**${element.name}**`,
      element.description ? `\n\n${element.description}` : '',
      `\n\nType: ${element.type}`,
      `\nItems: ${String(element.count)}`,
      element.type !== 'domain' ? `\nFull path: ${element.id}` : '',
    ].join('');

    item.tooltip.appendMarkdown(tooltipContent);

    // Add command for clicking on tags
    if (element.type === 'subdomain' || element.type === 'tag') {
      item.command = {
        command: 'obsidian-magic.openTaggedFiles',
        title: 'Open Tagged Files',
        arguments: [element],
      };
    }

    return item;
  }

  /**
   * Load tag data from the core tagging system
   */
  private async loadTagData(): Promise<void> {
    try {
      // Get the full taxonomy
      const taxonomy = this.taxonomyManager.getTaxonomy();

      // Convert taxonomy to TagNode structure
      // Create domain level nodes
      this.tags = await Promise.resolve(
        taxonomy.domains.map((domain) => {
          // Get subdomains for this domain, ensuring we have an array
          const subdomains = taxonomy.subdomains[domain];
          const subdomainArray = Array.isArray(subdomains)
            ? subdomains
            : typeof subdomains === 'string'
              ? [subdomains]
              : [];

          // Create domain node
          return {
            id: domain,
            name: domain,
            type: 'domain' as const,
            description: `${domain} domain`,
            count: subdomainArray.length,
            children: subdomainArray.map((subdomain: string) => {
              // Create subdomain nodes
              return {
                id: `${domain}.${subdomain}`,
                name: subdomain,
                type: 'subdomain' as const,
                description: `${subdomain} subdomain of ${domain}`,
                count: 0, // We don't have usage count in the data model
                children: [],
              };
            }),
          };
        })
      );

      // Notify tree view of data changes
      this.refresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      void vscode.window.showErrorMessage(`Failed to load tag taxonomy: ${errorMessage}`);
      throw new Error(String(errorMessage)); // Re-throw as proper Error
    }
  }

  /**
   * Register for events that might change tag data
   */
  private registerEventHandlers(): void {
    // Listen for command to add a new tag
    const addTagDisposable = vscode.commands.registerCommand('obsidian-magic.addTag', async () => {
      try {
        // Prompt for tag name
        const tagName = await vscode.window.showInputBox({
          placeHolder: 'Enter tag name',
          prompt: 'Enter a new tag name',
        });

        if (!tagName) return;

        // Prompt for domain
        const domains = this.tags.map((tag) => tag.name);
        const domain = await vscode.window.showQuickPick(['<New Domain>', ...domains], {
          placeHolder: 'Select domain or create new',
        });

        if (!domain) return;

        if (domain === '<New Domain>') {
          const newDomain = await vscode.window.showInputBox({
            placeHolder: 'Enter domain name',
            prompt: 'Enter a new domain name',
          });

          if (!newDomain) return;

          // Add domain to taxonomy
          this.taxonomyManager.addDomain(newDomain);

          void vscode.window.showInformationMessage(`Domain '${newDomain}' added`);
        }

        // Add subdomain to taxonomy
        if (domain !== '<New Domain>') {
          this.taxonomyManager.addSubdomain(domain, tagName);
          void vscode.window.showInformationMessage(`Tag '${tagName}' added to ${domain}`);
        }

        // Refresh the tree view
        await this.loadTagData();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        void vscode.window.showErrorMessage(`Failed to add tag: ${errorMessage}`);
      }
    });

    // Listen for command to delete a tag
    const deleteTagDisposable = vscode.commands.registerCommand('obsidian-magic.deleteTag', async (node: TagNode) => {
      try {
        // Confirm deletion
        const confirmation = await vscode.window.showWarningMessage(
          `Are you sure you want to delete ${node.type} '${node.name}'?`,
          'Yes',
          'No'
        );

        if (confirmation !== 'Yes') return;

        // The core TaxonomyManager doesn't have direct delete methods
        // We would need to implement custom deletion logic
        void vscode.window.showInformationMessage('Deleting tags is not yet implemented in the core API');

        // Refresh the tree view
        await this.loadTagData();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        void vscode.window.showErrorMessage(`Failed to delete ${node.type}: ${errorMessage}`);
      }
    });

    this.disposables.push(addTagDisposable, deleteTagDisposable);
  }

  /**
   * Refresh the tree view
   * @param element Optional element to refresh, or undefined to refresh the entire tree
   */
  refresh(element?: TagNode): void {
    this._onDidChangeTreeData.fire(element);
  }

  /**
   * Get tree item for a given element
   */
  getTreeItem(element: TagNode): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.name,
      element.type === 'domain' && element.children.length > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None
    );

    // Set tree item properties
    treeItem.id = element.id;
    treeItem.tooltip = element.description ?? element.name;
    treeItem.contextValue = element.type;

    // Set appropriate icon based on type
    if (element.type === 'domain') {
      treeItem.iconPath = new vscode.ThemeIcon('symbol-folder');
    } else {
      treeItem.iconPath = new vscode.ThemeIcon('tag');
    }

    // Add badge for count if greater than 0
    if (element.count > 0) {
      treeItem.description = String(element.count);
    }

    return treeItem;
  }

  /**
   * Get children for a given element, or root if no element provided
   */
  getChildren(element?: TagNode): TagNode[] {
    if (!element) {
      return this.tags;
    }

    return element.children;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
    this._onDidChangeTreeData.dispose();
  }
}

/**
 * Register the tag explorer view
 * @param context The extension context
 * @returns The tree view instance
 */
export function registerTagExplorer(context: vscode.ExtensionContext): vscode.TreeView<TagNode> {
  // Initialize core services
  const core = initializeCore({});

  // Create tag explorer with core services
  const tagExplorer = new TagExplorer(context, core.taxonomyManager);

  // Register the tree data provider
  const treeView = vscode.window.createTreeView('obsidianMagicTags', {
    treeDataProvider: tagExplorer,
    showCollapseAll: true,
  });

  // Add explorer to subscriptions for cleanup
  context.subscriptions.push(treeView);
  context.subscriptions.push(tagExplorer);

  return treeView;
}
