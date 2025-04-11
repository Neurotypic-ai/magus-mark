import { ItemView, WorkspaceLeaf } from 'obsidian';
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
  
  private renderTagsList(container: HTMLElement, filterTerm: string = ''): void {
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
      editBtn.addEventListener('click', () => this.handleEditTag(tag));
      
      // Delete button
      const deleteBtn = tagEl.createEl('button', { 
        cls: 'tag-delete-btn',
        text: 'Delete'
      });
      deleteBtn.addEventListener('click', () => this.handleDeleteTag(tag));
    });
  }
  
  private getAllTags(): Array<{ id: string, name: string, count: number }> {
    // This is a placeholder - we'll need to implement actual tag retrieval
    // using the Obsidian API and metadata cache
    
    // For now, return a mock list
    return [
      { id: '1', name: '#project/obsidian', count: 12 },
      { id: '2', name: '#status/active', count: 8 },
      { id: '3', name: '#topic/ai', count: 15 },
      { id: '4', name: '#project/thesis', count: 5 },
      { id: '5', name: '#status/completed', count: 3 },
      { id: '6', name: '#person/alice', count: 2 },
    ];
  }
  
  private renderStats(container: HTMLElement): void {
    // Clear the container
    container.empty();
    
    // Mock stats for now - will be replaced with actual stats
    const stats = {
      totalTags: 15,
      totalFiles: 42,
      totalTaggedFiles: 38,
      coveragePercentage: 90.5,
      mostUsedTag: '#topic/ai'
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