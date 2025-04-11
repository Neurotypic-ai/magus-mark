import { ItemView, WorkspaceLeaf } from 'obsidian';
import type ObsidianMagicPlugin from '../main';

export const TAG_VISUALIZATION_VIEW_TYPE = 'obsidian-magic-tag-visualization';

export class TagVisualizationView extends ItemView {
  private plugin: ObsidianMagicPlugin;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  constructor(leaf: WorkspaceLeaf, plugin: ObsidianMagicPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  override getViewType(): string {
    return TAG_VISUALIZATION_VIEW_TYPE;
  }

  override getDisplayText(): string {
    return 'Tag Visualization';
  }

  override getIcon(): string {
    return 'graph';
  }

  override async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    if (!container) return;
    
    container.empty();
    container.createEl('h2', { text: 'Tag Relationships' });
    
    // Create controls
    const controlsContainer = container.createDiv('visualization-controls');
    
    // Create zoom slider
    const zoomContainer = controlsContainer.createDiv('control-container');
    zoomContainer.createEl('span', { text: 'Zoom: ' });
    const zoomSlider = zoomContainer.createEl('input', {
      type: 'range',
      attr: {
        min: '0.5',
        max: '2',
        step: '0.1',
        value: '1'
      }
    });
    
    // Create filter input
    const filterContainer = controlsContainer.createDiv('control-container');
    filterContainer.createEl('span', { text: 'Filter: ' });
    const filterInput = filterContainer.createEl('input', {
      type: 'text',
      placeholder: 'Enter tag name...'
    });
    
    // Create visualization canvas
    const canvasContainer = container.createDiv('visualization-container');
    this.canvas = canvasContainer.createEl('canvas', {
      attr: {
        width: '800',
        height: '600'
      }
    });
    
    // Get the canvas context
    this.ctx = this.canvas.getContext('2d');
    
    // Initialize the visualization
    this.initializeVisualization();
    
    // Add event listeners
    zoomSlider.addEventListener('input', () => {
      this.updateZoom(parseFloat(zoomSlider.value));
    });
    
    filterInput.addEventListener('input', () => {
      this.updateFilter(filterInput.value);
    });
    
    // Add resize handling
    this.registerDomEvent(window, 'resize', () => {
      this.resizeCanvas();
    });
    
    // Initial resize
    this.resizeCanvas();
  }

  override async onClose(): Promise<void> {
    // Clean up any resources when view is closed
  }
  
  private resizeCanvas(): void {
    if (!this.canvas) return;
    
    const container = this.canvas.parentElement;
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight || 600;
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Redraw visualization
    this.drawVisualization();
  }
  
  private initializeVisualization(): void {
    // Fetch tag data and initialize the visualization
    // This is a placeholder for actual implementation
    this.drawVisualization();
  }
  
  private drawVisualization(): void {
    if (!this.ctx || !this.canvas) return;
    
    const { width, height } = this.canvas;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);
    
    // Draw background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    this.ctx.fillRect(0, 0, width, height);
    
    // Get tag data
    const tags = this.getTagData();
    
    // Calculate positions (simple circle layout for now)
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;
    
    // Draw connections
    this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    this.ctx.lineWidth = 1;
    
    // Draw each tag and connections
    tags.forEach((tag, i) => {
      const angle = (i / tags.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Store position
      tag.x = x;
      tag.y = y;
      
      // Draw connections based on related tags
      if (tag.related) {
        tag.related.forEach(relatedId => {
          const relatedTag = tags.find(t => t.id === relatedId);
          if (relatedTag && relatedTag.x && relatedTag.y) {
            this.ctx!.beginPath();
            this.ctx!.moveTo(x, y);
            this.ctx!.lineTo(relatedTag.x, relatedTag.y);
            this.ctx!.stroke();
          }
        });
      }
    });
    
    // Draw nodes
    tags.forEach(tag => {
      if (typeof tag.x !== 'number' || typeof tag.y !== 'number') return;
      
      // Draw circle
      this.ctx!.beginPath();
      this.ctx!.arc(tag.x, tag.y, 10, 0, Math.PI * 2);
      this.ctx!.fillStyle = 'rgba(66, 135, 245, 0.8)';
      this.ctx!.fill();
      
      // Draw text
      this.ctx!.font = '12px Arial';
      this.ctx!.fillStyle = 'black';
      this.ctx!.textAlign = 'center';
      this.ctx!.fillText(tag.name, tag.x, tag.y + 25);
    });
  }
  
  private updateZoom(zoom: number): void {
    // Implement zoom functionality
    // This is a placeholder for actual implementation
    this.drawVisualization();
  }
  
  private updateFilter(filter: string): void {
    // Implement filter functionality
    // This is a placeholder for actual implementation
    this.drawVisualization();
  }
  
  private getTagData(): Array<{
    id: string;
    name: string;
    count: number;
    related?: string[];
    x?: number;
    y?: number;
  }> {
    // Get all tags from Obsidian's metadata cache
    const metadataCache = this.plugin.app.metadataCache;
    const files = this.plugin.app.vault.getMarkdownFiles();
    
    // Tag tracking
    const tagMap = new Map<string, {
      id: string;
      name: string;
      count: number;
      related: Set<string>;
    }>();
    
    // Helper to process a tag
    const processTag = (tagName: string) => {
      // Skip empty tags
      if (!tagName) return;
      
      // Normalize tag format
      const normalizedTag = tagName.startsWith('#') ? tagName : `#${tagName}`;
      const tagId = `tag-${normalizedTag.replace(/[^a-zA-Z0-9]/g, '-')}`;
      
      // Get or create tag entry
      if (!tagMap.has(normalizedTag)) {
        tagMap.set(normalizedTag, {
          id: tagId,
          name: normalizedTag,
          count: 1,
          related: new Set<string>()
        });
      } else {
        // Increment count
        const tag = tagMap.get(normalizedTag)!;
        tag.count += 1;
      }
      
      return { tagName: normalizedTag, tagId };
    };
    
    // Process each file to collect tags and their relationships
    files.forEach(file => {
      // Get file's cache
      const fileCache = metadataCache.getFileCache(file);
      if (!fileCache) return;
      
      // Process frontmatter tags
      const frontmatterTags: string[] = [];
      if (fileCache.frontmatter && fileCache.frontmatter['tags']) {
        const fmTags = fileCache.frontmatter['tags'];
        if (Array.isArray(fmTags)) {
          fmTags.forEach(tag => {
            const tagName = typeof tag === 'string' ? tag : String(tag);
            const processed = processTag(tagName);
            if (processed) frontmatterTags.push(processed.tagName);
          });
        } else if (typeof fmTags === 'string') {
          const processed = processTag(fmTags);
          if (processed) frontmatterTags.push(processed.tagName);
        }
      }
      
      // Process inline tags
      const inlineTags: string[] = [];
      if (fileCache.tags) {
        fileCache.tags.forEach(tagCache => {
          const processed = processTag(tagCache.tag);
          if (processed) inlineTags.push(processed.tagName);
        });
      }
      
      // Combine all tags found in this file
      const fileTags = [...new Set([...frontmatterTags, ...inlineTags])].filter(tag => tag !== undefined) as string[];
      
      // Build relationships between tags (tags that appear in the same file)
      for (let i = 0; i < fileTags.length; i++) {
        const tag1 = fileTags[i];
        if (!tag1) continue;
        
        for (let j = i + 1; j < fileTags.length; j++) {
          const tag2 = fileTags[j];
          if (!tag2) continue;
          
          // Add bidirectional relationship
          const tagData1 = tagMap.get(tag1);
          const tagData2 = tagMap.get(tag2);
          
          if (tagData1 && tagData2) {
            tagData1.related.add(tagData2.id);
            tagData2.related.add(tagData1.id);
          }
        }
      }
    });
    
    // Convert map to array and transform related sets to arrays
    return Array.from(tagMap.values())
      .map(tag => ({
        id: tag.id,
        name: tag.name,
        count: tag.count,
        related: Array.from(tag.related)
      }));
  }
} 