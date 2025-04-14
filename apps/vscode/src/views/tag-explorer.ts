import * as vscode from 'vscode';

import { TaggingService, TaxonomyManager } from '@obsidian-magic/core';

import type { Category, Tag, Taxonomy } from '@obsidian-magic/core';

// Tag node representation for the tree view
interface TagNode {
  id: string;
  name: string;
  description?: string | undefined;
  children: TagNode[];
  type: 'tag' | 'category';
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
  private taggingService: TaggingService;

  /**
   * Creates a new TagExplorer instance
   * @param context The extension context
   * @param taxonomyManager The taxonomy manager instance
   * @param taggingService The tagging service instance
   */
  constructor(_context: vscode.ExtensionContext, taxonomyManager: TaxonomyManager, taggingService: TaggingService) {
    this.taxonomyManager = taxonomyManager;
    this.taggingService = taggingService;

    // Load initial tag data
    void this.loadTagData().catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      void vscode.window.showErrorMessage(`Failed to initialize tag explorer: ${errorMessage}`);
    });

    // Register for events that might change tag data
    this.registerEventHandlers();

    // Listen for taxonomy changes
    const onChanged = this.taxonomyManager.onTaxonomyChanged;
    if (typeof onChanged === 'function') {
      onChanged(() => {
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
      element.type === 'tag' ? `\nFull path: ${element.id}` : '',
    ].join('');

    item.tooltip.appendMarkdown(tooltipContent);

    // Add command for clicking on tags (not categories)
    if (element.type === 'tag') {
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
      const taxonomy = (await this.taxonomyManager.getTaxonomy()) as Taxonomy;

      // Convert taxonomy to TagNode structure
      this.tags = Object.entries(taxonomy.categories ?? {}).map(([categoryId, category]) => {
        const typedCategory = category as Category;
        return {
          id: categoryId,
          name: typedCategory.name,
          type: 'category' as const,
          description: typedCategory.description,
          count: typedCategory.tags?.length ?? 0,
          children: (typedCategory.tags ?? []).map((tag: Tag) => ({
            id: `${categoryId}.${tag.id ?? ''}`,
            name: tag.name ?? '',
            type: 'tag' as const,
            description: tag.description,
            count: tag.usageCount ?? 0,
            children: [],
          })),
        };
      });

      // Notify tree view of data changes
      this.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      void vscode.window.showErrorMessage(`Failed to load tag taxonomy: ${errorMessage}`);
      throw error; // Re-throw to be handled by caller
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

        // Prompt for description
        const description = await vscode.window.showInputBox({
          placeHolder: 'Enter tag description (optional)',
          prompt: 'Enter a description for the tag',
        });

        // Prompt for category
        const categories = this.tags.map((tag) => tag.name);
        const category = await vscode.window.showQuickPick(['<New Category>', ...categories], {
          placeHolder: 'Select category or create new',
        });

        if (!category) return;

        if (category === '<New Category>') {
          const newCategory = await vscode.window.showInputBox({
            placeHolder: 'Enter category name',
            prompt: 'Enter a new category name',
          });

          if (!newCategory) return;

          // Create new category in taxonomy
          const categoryDescription = await vscode.window.showInputBox({
            placeHolder: 'Enter category description (optional)',
            prompt: 'Enter a description for the category',
          });

          await this.taxonomyManager.addCategory({
            name: newCategory,
            description: categoryDescription ?? undefined,
          });
        }

        // Add new tag to taxonomy
        await this.taxonomyManager.addTag({
          name: tagName,
          description: description ?? undefined,
          categoryId: this.tags.find((t) => t.name === category)?.id ?? '',
        });

        // Refresh the tree view
        await this.loadTagData();

        void vscode.window.showInformationMessage(`Tag '${tagName}' added to category '${category}'`);
      } catch (error) {
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

        if (node.type === 'tag') {
          await this.taxonomyManager.deleteTag(node.id);
        } else {
          await this.taxonomyManager.deleteCategory(node.id);
        }

        // Refresh the tree view
        await this.loadTagData();

        void vscode.window.showInformationMessage(`${node.type === 'tag' ? 'Tag' : 'Category'} '${node.name}' deleted`);
      } catch (error) {
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
      element.type === 'category' && element.children.length > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None
    );

    // Set tree item properties
    treeItem.id = element.id;
    treeItem.tooltip = element.description ?? element.name;
    treeItem.contextValue = element.type;

    // Set appropriate icon based on type
    if (element.type === 'category') {
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
 * Register the tag explorer tree view
 * @returns The created tree view
 */
export function registerTagExplorer(context: vscode.ExtensionContext): vscode.TreeView<TagNode> {
  // Create explorer instance
  const tagExplorer = new TagExplorer(context, new TaxonomyManager(), new TaggingService(new TaxonomyManager()));

  // Register tree data provider
  const treeView = vscode.window.createTreeView<TagNode>('obsidianMagicTagExplorer', {
    treeDataProvider: tagExplorer,
    showCollapseAll: true,
  });

  // Add explorer to disposables
  context.subscriptions.push(tagExplorer);

  return treeView;
}
