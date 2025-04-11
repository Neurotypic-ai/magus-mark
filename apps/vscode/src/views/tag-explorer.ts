import * as vscode from 'vscode';

/**
 * Tag data model for the explorer
 */
export interface Tag {
  id: string;
  name: string;
  color?: string;
  count: number;
  children?: Tag[];
}

/**
 * Tree data provider for the Obsidian Magic Tag Explorer
 */
export class TagExplorerProvider implements vscode.TreeDataProvider<TagTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TagTreeItem | undefined | null | void> = new vscode.EventEmitter<TagTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TagTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
  
  private tags: Tag[] = [];

  constructor() {
    // Load tags initially with mock data
    this.loadTags();
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Load tags from the data source
   * In a real implementation, this would connect to the tag system
   */
  private loadTags(): void {
    // Mock data for now
    this.tags = [
      {
        id: 'concepts',
        name: 'Concepts',
        color: '#4287f5',
        count: 15,
        children: [
          { id: 'ai', name: 'AI', color: '#42b0f5', count: 8 },
          { id: 'programming', name: 'Programming', color: '#42f5a7', count: 7 }
        ]
      },
      {
        id: 'projects',
        name: 'Projects',
        color: '#f542b0',
        count: 10,
        children: [
          { id: 'obsidian-magic', name: 'Obsidian Magic', color: '#f5b042', count: 5 },
          { id: 'personal', name: 'Personal', color: '#f55442', count: 5 }
        ]
      },
      {
        id: 'status',
        name: 'Status',
        color: '#a142f5',
        count: 8,
        children: [
          { id: 'todo', name: 'Todo', color: '#f54242', count: 3 },
          { id: 'in-progress', name: 'In Progress', color: '#f5d042', count: 2 },
          { id: 'completed', name: 'Completed', color: '#42f54e', count: 3 }
        ]
      }
    ];
  }

  /**
   * Get TreeItem for a given element
   */
  getTreeItem(element: TagTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children for a given element
   */
  getChildren(element?: TagTreeItem): Thenable<TagTreeItem[]> {
    if (!element) {
      // Root level - return top-level tags
      return Promise.resolve(this.tags.map(tag => new TagTreeItem(tag)));
    } else {
      // Child level - return children if any
      return Promise.resolve(
        (element.tag.children || []).map(child => new TagTreeItem(child))
      );
    }
  }

  /**
   * Add a new tag
   */
  addTag(name: string, parentId?: string): void {
    const newTag: Tag = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      color: this.getRandomColor(),
      count: 0
    };

    if (parentId) {
      // Add as child to existing tag
      const addChildToTag = (tags: Tag[]): boolean => {
        for (const tag of tags) {
          if (tag.id === parentId) {
            tag.children = tag.children || [];
            tag.children.push(newTag);
            return true;
          }
          if (tag.children) {
            if (addChildToTag(tag.children)) {
              return true;
            }
          }
        }
        return false;
      };

      addChildToTag(this.tags);
    } else {
      // Add as top-level tag
      this.tags.push(newTag);
    }

    this.refresh();
  }

  /**
   * Delete a tag
   */
  deleteTag(id: string): void {
    // Remove from top level
    this.tags = this.tags.filter(tag => tag.id !== id);
    
    // Remove from children
    const removeFromChildren = (tags: Tag[]): void => {
      for (const tag of tags) {
        if (tag.children) {
          tag.children = tag.children.filter(child => child.id !== id);
          removeFromChildren(tag.children);
        }
      }
    };
    
    removeFromChildren(this.tags);
    this.refresh();
  }

  /**
   * Generate a random color for a new tag
   */
  private getRandomColor(): string {
    const colors = [
      '#4287f5', '#42b0f5', '#42f5a7', '#f542b0', 
      '#f5b042', '#f55442', '#a142f5', '#f54242'
    ];
    const index = Math.floor(Math.random() * colors.length);
    return colors[index] || '#4287f5'; // Provide default color in case of undefined
  }
}

/**
 * TreeItem implementation for a tag
 */
export class TagTreeItem extends vscode.TreeItem {
  constructor(public readonly tag: Tag) {
    super(
      tag.name,
      tag.children && tag.children.length > 0 
        ? vscode.TreeItemCollapsibleState.Collapsed 
        : vscode.TreeItemCollapsibleState.None
    );
    
    this.tooltip = `${tag.name} (${tag.count} items)`;
    this.description = `${tag.count}`;
    this.contextValue = 'tag';
    
    // Apply tag-specific styles
    this.iconPath = new vscode.ThemeIcon('tag', new vscode.ThemeColor('charts.blue'));
    
    // Set color if available
    if (tag.color) {
      // VS Code doesn't support direct color styling in TreeItems
      // In a full implementation, we would use decorations or custom views
    }
  }
}

/**
 * Registers the Tag Explorer view
 */
export function registerTagExplorer(context: vscode.ExtensionContext): vscode.Disposable {
  // Create the tree data provider
  const tagExplorerProvider = new TagExplorerProvider();
  
  // Register the tree data provider
  const treeView = vscode.window.createTreeView('obsidianMagicTagExplorer', {
    treeDataProvider: tagExplorerProvider,
    showCollapseAll: true
  });
  
  // Register commands related to the tag explorer
  const addTagCommand = vscode.commands.registerCommand('obsidian-magic.addTag', async () => {
    const tagName = await vscode.window.showInputBox({
      placeHolder: 'Enter tag name',
      prompt: 'Create a new tag'
    });
    
    if (tagName) {
      tagExplorerProvider.addTag(tagName);
      vscode.window.showInformationMessage(`Tag '${tagName}' created.`);
    }
  });
  
  const deleteTagCommand = vscode.commands.registerCommand('obsidian-magic.deleteTag', async (item: TagTreeItem) => {
    if (item) {
      const confirm = await vscode.window.showWarningMessage(
        `Are you sure you want to delete tag '${item.tag.name}'?`,
        { modal: true },
        'Delete'
      );
      
      if (confirm && confirm === 'Delete') {
        tagExplorerProvider.deleteTag(item.tag.id);
        vscode.window.showInformationMessage(`Tag '${item.tag.name}' deleted.`);
      }
    }
  });
  
  // Add command registrations to context
  context.subscriptions.push(treeView, addTagCommand, deleteTagCommand);
  
  return treeView;
} 