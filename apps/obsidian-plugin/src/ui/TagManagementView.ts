import type { WorkspaceLeaf } from 'obsidian';
import { ItemView } from 'obsidian';
import type ObsidianMagicPlugin from '../main';

export const TAG_MANAGEMENT_VIEW_TYPE = 'obsidian-magic-tag-management';

export class TagManagementView extends ItemView {
  plugin: ObsidianMagicPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: ObsidianMagicPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  override getViewType(): string {
    return TAG_MANAGEMENT_VIEW_TYPE;
  }

  override getDisplayText(): string {
    return 'Tag Management';
  }

  override getIcon(): string {
    return 'tag';
  }

  override async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    if (!container) return;
    
    container.empty();
    container.createEl('h2', { text: 'Obsidian Magic Tag Management' });
    
    // Tags section
    const tagsSection = container.createDiv('tag-section');
    tagsSection.createEl('h3', { text: 'Your Tags' });
    
    // Create a search bar
    const searchContainer = tagsSection.createDiv('search-container');
    searchContainer.createEl('span', { text: 'Filter tags: ' });
    const searchInput = searchContainer.createEl('input', {
      type: 'text',
      placeholder: 'Search tags...'
    });
    
    // Create tags list
    const tagsList = tagsSection.createDiv('tags-list');
    this.renderTagsList(tagsList);
    
    // Add search functionality
    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.toLowerCase();
      this.renderTagsList(tagsList, searchTerm);
    });
    
    // Actions section
    const actionsSection = container.createDiv('actions-section');
    actionsSection.createEl('h3', { text: 'Actions' });
    
    // Batch tagging
    const batchTaggingContainer = actionsSection.createDiv('action-container');
    const batchTaggingButton = batchTaggingContainer.createEl('button', {
      text: 'Batch Tag Selected Files'
    });
    batchTaggingButton.addEventListener('click', this.handleBatchTagging.bind(this));
    
    // Tag management
    const tagManagementContainer = actionsSection.createDiv('action-container');
    const mergeTagsButton = tagManagementContainer.createEl('button', {
      text: 'Merge Similar Tags'
    });
    mergeTagsButton.addEventListener('click', this.handleMergeTags.bind(this));
    
    // Stats section
    const statsSection = container.createDiv('stats-section');
    statsSection.createEl('h3', { text: 'Statistics' });
    const statsContent = statsSection.createDiv('stats-content');
    this.renderStats(statsContent);
  }

  override async onClose(): Promise<void> {
    // Clean up any event listeners or resources when view is closed
  }
  
  private renderTagsList(container: HTMLElement, filterTerm = ''): void {
    // Clear the container
    container.empty();
    
    // Get all tags from the vault
    const tags = this.getAllTags();
    
    // Filter tags if a search term is provided
    const filteredTags = filterTerm 
      ? tags.filter(tag => tag.name.toLowerCase().includes(filterTerm))
      : tags;
    
    // No tags message
    if (filteredTags.length === 0) {
      container.createEl('p', { 
        text: filterTerm 
          ? 'No matching tags found.' 
          : 'No tags found in your vault.'
      });
      return;
    }
    
    // Create tag elements
    filteredTags.forEach(tag => {
      const tagEl = container.createDiv('tag-item');
      
      // Tag checkbox for selection
      const checkbox = tagEl.createEl('input', { type: 'checkbox' });
      checkbox.dataset['tagId'] = tag.id;
      
      // Tag name
      const nameEl = tagEl.createSpan('tag-name');
      nameEl.setText(tag.name);
      
      // Tag count
      const countEl = tagEl.createSpan('tag-count');
      countEl.setText(`(${tag.count})`);
      
      // Edit button
      const editBtn = tagEl.createEl('button', { 
        cls: 'tag-edit-btn',
        text: 'Edit'
      });
      editBtn.addEventListener('click', () => { this.handleEditTag(tag); });
      
      // Delete button
      const deleteBtn = tagEl.createEl('button', { 
        cls: 'tag-delete-btn',
        text: 'Delete'
      });
      deleteBtn.addEventListener('click', () => { this.handleDeleteTag(tag); });
    });
  }
  
  private getAllTags(): { id: string, name: string, count: number }[] {
    // Get all tags from Obsidian's metadata cache
    const metadataCache = this.plugin.app.metadataCache;
    const files = this.plugin.app.vault.getMarkdownFiles();
    
    // Tag tracking
    const tagMap = new Map<string, { id: string, name: string, count: number }>();
    
    // Process each file
    files.forEach(file => {
      // Get file's cache
      const fileCache = metadataCache.getFileCache(file);
      
      if (!fileCache) return;
      
      // Get tags from frontmatter
      const frontmatterTags = fileCache.frontmatter ? fileCache.frontmatter['tags'] || [] : [];
      // Get tags from content
      const tags = fileCache.tags || [];
      
      // Process frontmatter tags (can be array or string)
      if (Array.isArray(frontmatterTags)) {
        frontmatterTags.forEach(tag => {
          // Clean tag name
          const tagName = typeof tag === 'string' ? tag : String(tag);
          const normalizedTag = tagName.startsWith('#') ? tagName : `#${tagName}`;
          
          this.addToTagMap(tagMap, normalizedTag);
        });
      } else if (typeof frontmatterTags === 'string') {
        const normalizedTag = frontmatterTags.startsWith('#') ? frontmatterTags : `#${frontmatterTags}`;
        this.addToTagMap(tagMap, normalizedTag);
      }
      
      // Process content tags
      tags.forEach(tagCache => {
        const tagName = tagCache.tag;
        this.addToTagMap(tagMap, tagName);
      });
    });
    
    // Convert map to array and sort by name
    return Array.from(tagMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  private addToTagMap(tagMap: Map<string, { id: string, name: string, count: number }>, tagName: string): void {
    // Skip empty tags
    if (!tagName) return;
    
    // Get or create tag entry
    if (tagMap.has(tagName)) {
      // Increment count
      const tag = tagMap.get(tagName)!;
      tag.count += 1;
    } else {
      // Create new entry
      tagMap.set(tagName, {
        id: `tag-${tagName.replace(/[^a-zA-Z0-9]/g, '-')}`,
        name: tagName,
        count: 1
      });
    }
  }
  
  private renderStats(container: HTMLElement): void {
    // Clear the container
    container.empty();
    
    // Get all tags
    const tags = this.getAllTags();
    
    // Calculate stats
    const stats = {
      totalTags: tags.length,
      totalFiles: this.plugin.app.vault.getMarkdownFiles().length,
      totalTaggedFiles: this.getTaggedFilesCount(),
      coveragePercentage: this.calculateCoveragePercentage(),
      mostUsedTag: this.getMostUsedTag(tags)
    };
    
    // Create a table for the stats
    const table = container.createEl('table');
    const tbody = table.createEl('tbody');
    
    // Add rows for each stat
    this.addStatRow(tbody, 'Total tags', stats.totalTags);
    this.addStatRow(tbody, 'Total files', stats.totalFiles);
    this.addStatRow(tbody, 'Tagged files', stats.totalTaggedFiles);
    this.addStatRow(tbody, 'Coverage', `${stats.coveragePercentage}%`);
    this.addStatRow(tbody, 'Most used tag', stats.mostUsedTag);
  }
  
  private getTaggedFilesCount(): number {
    const metadataCache = this.plugin.app.metadataCache;
    const files = this.plugin.app.vault.getMarkdownFiles();
    
    // Count files with tags
    let count = 0;
    
    files.forEach(file => {
      const fileCache = metadataCache.getFileCache(file);
      
      if (fileCache) {
        // Check for frontmatter tags
        const hasFrontmatterTags = fileCache.frontmatter ? !!fileCache.frontmatter['tags'] : false;
        // Check for content tags
        const hasContentTags = fileCache.tags && fileCache.tags.length > 0;
        
        if (hasFrontmatterTags || hasContentTags) {
          count++;
        }
      }
    });
    
    return count;
  }
  
  private calculateCoveragePercentage(): number {
    const totalFiles = this.plugin.app.vault.getMarkdownFiles().length;
    const taggedFiles = this.getTaggedFilesCount();
    
    if (totalFiles === 0) return 0;
    
    return Math.round((taggedFiles / totalFiles) * 100 * 10) / 10; // One decimal place
  }
  
  private getMostUsedTag(tags: { id: string, name: string, count: number }[]): string {
    if (tags.length === 0) return 'No tags';
    
    // Find tag with highest count
    const mostUsedTag = tags.reduce((prev, current) => 
      (prev.count > current.count) ? prev : current
    );
    
    return mostUsedTag.name;
  }
  
  private addStatRow(tbody: HTMLElement, label: string, value: string | number): void {
    const row = tbody.createEl('tr');
    row.createEl('td', { text: label });
    row.createEl('td', { text: value.toString() });
  }
  
  private handleBatchTagging(): void {
    console.log('Batch tagging initiated');
    // Will implement actual batch tagging functionality
  }
  
  private handleMergeTags(): void {
    console.log('Merge tags initiated');
    // Will implement tag merging functionality
  }
  
  private handleEditTag(tag: { id: string, name: string }): void {
    console.log(`Edit tag: ${tag.name}`);
    // Will implement tag editing functionality
  }
  
  private handleDeleteTag(tag: { id: string, name: string }): void {
    console.log(`Delete tag: ${tag.name}`);
    // Will implement tag deletion functionality
  }
} 