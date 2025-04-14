import * as vscode from 'vscode';

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

  /**
   * Creates a new TagExplorer instance
   * @param context The extension context
   */
  constructor(context: vscode.ExtensionContext) {
    // eslint-disable-line @typescript-eslint/no-unused-vars
    // Load initial tag data
    this.loadTagData();

    // Register for events that might change tag data
    this.registerEventHandlers();
  }

  /**
   * Gets the parent of a node (not implemented)
   * @param element The element to find the parent of
   */
  getParent?(element: TagNode): vscode.ProviderResult<TagNode> {
    // eslint-disable-line @typescript-eslint/no-unused-vars
    throw new Error('Method not implemented.');
  }

  /**
   * Resolves a tree item (not implemented)
   * @param item The tree item to resolve
   * @param element The associated element
   * @param token Cancellation token
   */
  resolveTreeItem?(
    item: vscode.TreeItem, // eslint-disable-line @typescript-eslint/no-unused-vars
    element: TagNode, // eslint-disable-line @typescript-eslint/no-unused-vars
    token: vscode.CancellationToken // eslint-disable-line @typescript-eslint/no-unused-vars
  ): vscode.ProviderResult<vscode.TreeItem> {
    throw new Error('Method not implemented.');
  }

  /**
   * Load tag data - in a real implementation, this would load from the core tagging system
   */
  private loadTagData(): void {
    // Mock data - in a real implementation, this would come from the tagging system
    this.tags = [
      {
        id: 'concept',
        name: 'Concept',
        type: 'category',
        description: 'Conceptual discussions',
        count: 15,
        children: [
          {
            id: 'concept.architecture',
            name: 'Architecture',
            type: 'tag',
            description: 'System architecture discussions',
            count: 8,
            children: [],
          },
          {
            id: 'concept.algorithms',
            name: 'Algorithms',
            type: 'tag',
            description: 'Algorithm discussions',
            count: 7,
            children: [],
          },
        ],
      },
      {
        id: 'implementation',
        name: 'Implementation',
        type: 'category',
        description: 'Implementation details',
        count: 23,
        children: [
          {
            id: 'implementation.typescript',
            name: 'TypeScript',
            type: 'tag',
            description: 'TypeScript implementation details',
            count: 12,
            children: [],
          },
          {
            id: 'implementation.python',
            name: 'Python',
            type: 'tag',
            description: 'Python implementation details',
            count: 11,
            children: [],
          },
        ],
      },
      {
        id: 'ai',
        name: 'AI',
        type: 'category',
        description: 'AI-related discussions',
        count: 18,
        children: [
          {
            id: 'ai.openai',
            name: 'OpenAI',
            type: 'tag',
            description: 'OpenAI-specific discussions',
            count: 10,
            children: [],
          },
          {
            id: 'ai.anthropic',
            name: 'Anthropic',
            type: 'tag',
            description: 'Anthropic-specific discussions',
            count: 8,
            children: [],
          },
        ],
      },
    ];

    // Notify tree view of data changes
    this.refresh();
  }

  /**
   * Register for events that might change tag data
   */
  private registerEventHandlers(): void {
    // Listen for command to add a new tag
    const addTagDisposable = vscode.commands.registerCommand('obsidian-magic.addTag', async () => {
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
      let category = await vscode.window.showQuickPick(['<New Category>', ...categories], {
        placeHolder: 'Select category or create new',
      });

      if (!category) return;

      // If new category selected, prompt for category name
      if (category === '<New Category>') {
        category = await vscode.window.showInputBox({
          placeHolder: 'Enter category name',
          prompt: 'Enter a new category name',
        });

        if (!category) return;

        // Add new category
        this.tags.push({
          id: category.toLowerCase().replace(/\s+/g, '-'),
          name: category,
          type: 'category',
          count: 0,
          children: [],
        });
      }

      // Find category node
      const categoryNode = this.tags.find((tag) => tag.name === category);

      if (categoryNode) {
        // Add new tag to category
        categoryNode.children.push({
          id: `${categoryNode.id}.${tagName.toLowerCase().replace(/\s+/g, '-')}`,
          name: tagName,
          type: 'tag',
          description: description ?? undefined,
          count: 0,
          children: [],
        });

        // Update category count
        categoryNode.count++;

        // Refresh the tree view
        this.refresh();

        vscode.window.showInformationMessage(`Tag '${tagName}' added to category '${category}'`);
      }
    });

    // Listen for command to delete a tag
    const deleteTagDisposable = vscode.commands.registerCommand('obsidian-magic.deleteTag', async (node: TagNode) => {
      // Confirm deletion
      const confirmation = await vscode.window.showWarningMessage(
        `Are you sure you want to delete tag '${node.name}'?`,
        'Yes',
        'No'
      );

      if (confirmation !== 'Yes') return;

      // Find parent category
      const categoryId = node.id.split('.')[0];
      const category = this.tags.find((tag) => tag.id === categoryId);

      if (category) {
        // Remove tag from category
        category.children = category.children.filter((child) => child.id !== node.id);

        // Update category count
        category.count = category.children.length;

        // Refresh the tree view
        this.refresh();

        vscode.window.showInformationMessage(`Tag '${node.name}' deleted`);
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
  const tagExplorer = new TagExplorer(context);

  // Register tree data provider
  const treeView = vscode.window.createTreeView<TagNode>('obsidianMagicTagExplorer', {
    treeDataProvider: tagExplorer,
    showCollapseAll: true,
  });

  // Add explorer to disposables
  context.subscriptions.push(tagExplorer);

  return treeView;
}
