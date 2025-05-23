import { ItemView } from 'obsidian';

import type { WorkspaceLeaf } from 'obsidian';

import type MagusMarkPlugin from '../main';

export const TAG_VISUALIZATION_VIEW_TYPE = 'magus-mark-tag-visualization';

interface TagNode {
  id: string;
  name: string;
  count: number;
  related?: string[];
  x?: number;
  y?: number;
  visible?: boolean;
  color?: string;
  radius?: number;
}

export class TagVisualizationView extends ItemView {
  private plugin: MagusMarkPlugin;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private tags: TagNode[] = [];
  private zoomLevel = 1;
  private filterText = '';
  private isDragging = false;
  private draggedNode: TagNode | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private colorMap: Record<string, string> = {};
  private animationFrameId: number | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: MagusMarkPlugin) {
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

    // Add a loading message while we fetch the data
    const loadingEl = container.createEl('div', { text: 'Loading tag visualization...' });

    try {
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
          value: '1',
        },
      });

      // Create filter input
      const filterContainer = controlsContainer.createDiv('control-container');
      filterContainer.createEl('span', { text: 'Filter: ' });
      const filterInput = filterContainer.createEl('input', {
        type: 'text',
        placeholder: 'Enter tag name...',
      });

      // Create visualization container with instructions
      container.createEl('p', {
        text: 'Drag nodes to reposition. Use zoom slider to adjust view. Filter to focus on specific tags.',
        cls: 'visualization-instructions',
      });

      // Create visualization canvas
      const canvasContainer = container.createDiv('visualization-container');
      this.canvas = canvasContainer.createEl('canvas', {
        attr: {
          width: '800',
          height: '600',
        },
      });

      // Get the canvas context
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) {
        console.error('Failed to get canvas context');
        return;
      }

      // Fetch tag data (await to make this async function have an await expression)
      this.tags = await Promise.resolve(this.getTagData());

      // Initialize color map
      this.initializeColorMap();

      // Initialize the visualization
      this.initializeVisualization();

      // Add event listeners
      zoomSlider.addEventListener('input', () => {
        const zoomValue = parseFloat(zoomSlider.value);
        this.updateZoom(zoomValue);
      });

      filterInput.addEventListener('input', () => {
        const filterValue = filterInput.value;
        this.updateFilter(filterValue);
      });

      // Add mouse interaction
      this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
      this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
      this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
      this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

      // Add touch interaction for mobile
      this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
      this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
      this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

      // Add resize handling
      this.registerDomEvent(window, 'resize', () => {
        this.resizeCanvas();
      });

      // Initial resize
      this.resizeCanvas();

      // Remove loading message
      loadingEl.remove();
    } catch (error) {
      // Show error state
      loadingEl.setText(`Error loading visualization: ${String(error)}`);
      loadingEl.addClass('error');
    }
  }

  override async onClose(): Promise<void> {
    // Cancel any ongoing animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      await Promise.resolve(); // Add await to satisfy linter
    }

    // Remove event listeners if needed
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
      this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
      this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
      this.canvas.removeEventListener('mouseleave', this.handleMouseUp.bind(this));

      this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
      this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
      this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    }
  }

  private initializeColorMap(): void {
    // Generate a color palette based on tag categories or frequency
    const hues = [210, 170, 120, 330, 270, 30, 10, 60, 290, 180];

    // Group tags by their first segment (e.g., #tool/hammer -> tool)
    const categories = new Set<string>();

    this.tags.forEach((tag) => {
      const parts = tag.name.replace('#', '').split('/');
      const category = parts[0];
      if (category) {
        categories.add(category);
      }
    });

    // Assign colors to categories
    Array.from(categories).forEach((category, i) => {
      const hue = hues[i % hues.length];
      if (hue) {
        this.colorMap[category] = `hsla(${String(hue)}, 70%, 60%, 0.8)`;
      }
    });
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
    // Calculate initial positions in a force-directed layout
    this.calculateLayout();

    // Start animation loop
    this.animateVisualization();
  }

  private calculateLayout(): void {
    if (!this.canvas) return;

    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;

    // For tags with many connections, place them more centrally
    this.tags.forEach((tag) => {
      const relatedCount = tag.related?.length ?? 0;
      const angle = Math.random() * Math.PI * 2;
      // More connected nodes placed closer to center
      const distance = ((Math.random() * 0.8 * Math.min(width, height)) / 2) * (1 - relatedCount / 20);

      tag.x = centerX + Math.cos(angle) * distance;
      tag.y = centerY + Math.sin(angle) * distance;
      tag.radius = Math.max(10, Math.min(20, 8 + Math.log(tag.count) * 4));

      // Determine tag color based on its category
      const category = tag.name.replace('#', '').split('/')[0];
      tag.color = (category && this.colorMap[category]) ?? 'rgba(66, 135, 245, 0.8)';

      // All tags visible by default
      tag.visible = true;
    });
  }

  private animateVisualization(): void {
    this.drawVisualization();
    this.animationFrameId = requestAnimationFrame(this.animateVisualization.bind(this));
  }

  private drawVisualization(): void {
    if (!this.ctx || !this.canvas) return;

    const { width, height } = this.canvas;
    const ctx = this.ctx; // Use a local reference to avoid repeating null checks

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, width, height);

    // Apply zoom transformation
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(this.zoomLevel, this.zoomLevel);
    ctx.translate(-width / 2, -height / 2);

    // Draw connections first (so they're under the nodes)
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = 1;

    const visibleTags = this.tags.filter((tag) => tag.visible);

    // Draw each tag and connections
    visibleTags.forEach((tag) => {
      if (typeof tag.x !== 'number' || typeof tag.y !== 'number') return;

      // Draw connections based on related tags
      if (tag.related) {
        tag.related.forEach((relatedId) => {
          const relatedTag = this.tags.find((t) => t.id === relatedId);
          if (relatedTag?.visible && typeof relatedTag.x === 'number' && typeof relatedTag.y === 'number') {
            // Ensure we have numeric coordinates for both tags
            if (typeof tag.x === 'number' && typeof tag.y === 'number') {
              ctx.beginPath();
              ctx.moveTo(tag.x, tag.y);
              ctx.lineTo(relatedTag.x, relatedTag.y);
              ctx.stroke();
            }
          }
        });
      }
    });

    // Draw nodes
    visibleTags.forEach((tag) => {
      if (typeof tag.x !== 'number' || typeof tag.y !== 'number') return;

      const radius = tag.radius ?? 10;

      // Draw circle
      ctx.beginPath();
      ctx.arc(tag.x, tag.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = tag.color ?? 'rgba(66, 135, 245, 0.8)';
      ctx.fill();

      // Add a highlight or border for more visible tags
      if (this.filterText && tag.name.toLowerCase().includes(this.filterText.toLowerCase())) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw text
      ctx.font = '12px Arial';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.fillText(tag.name, tag.x, tag.y + radius + 15);

      // Draw count
      if (tag.count > 1) {
        ctx.font = '10px Arial';
        ctx.fillText(`(${String(tag.count)})`, tag.x, tag.y + radius + 30);
      }
    });

    // Restore canvas transformation
    ctx.restore();
  }

  private updateZoom(zoom: number): void {
    this.zoomLevel = zoom;
    this.drawVisualization();
  }

  private updateFilter(filter: string): void {
    this.filterText = filter;

    if (!filter.trim()) {
      // If filter is empty, show all tags
      this.tags.forEach((tag) => {
        tag.visible = true;
      });
    } else {
      // If filter has text, show matching tags and their connections
      const lowerFilter = filter.toLowerCase();

      // First pass: mark direct matches
      const matchedTagIds = new Set<string>();

      this.tags.forEach((tag) => {
        const isMatch = tag.name.toLowerCase().includes(lowerFilter);
        tag.visible = isMatch;

        if (isMatch) {
          matchedTagIds.add(tag.id);
        }
      });

      // Second pass: show related tags
      if (matchedTagIds.size > 0) {
        this.tags.forEach((tag) => {
          if (tag.related) {
            // If this tag is connected to any matched tag, show it
            const hasMatchedRelation = tag.related.some((relatedId) => matchedTagIds.has(relatedId));
            if (hasMatchedRelation) {
              tag.visible = true;
            }
          }
        });
      }
    }

    this.drawVisualization();
  }

  private getNodeAtPosition(x: number, y: number): TagNode | null {
    // Apply inverse zoom to the coordinates
    if (!this.canvas) return null;

    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const adjustedX = x / this.zoomLevel - ((canvasWidth / this.zoomLevel) * (1 / this.zoomLevel - 1)) / 2;
    const adjustedY = y / this.zoomLevel - ((canvasHeight / this.zoomLevel) * (1 / this.zoomLevel - 1)) / 2;

    // Check if the point is inside any node
    for (const tag of this.tags) {
      if (!tag.visible || typeof tag.x !== 'number' || typeof tag.y !== 'number') continue;

      const radius = tag.radius ?? 10;
      const distance = Math.sqrt(Math.pow(adjustedX - tag.x, 2) + Math.pow(adjustedY - tag.y, 2));

      if (distance <= radius) {
        return tag;
      }
    }

    return null;
  }

  // Mouse event handlers
  private handleMouseDown(event: MouseEvent): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const node = this.getNodeAtPosition(x, y);

    if (node) {
      this.isDragging = true;
      this.draggedNode = node;
      this.dragStartX = x;
      this.dragStartY = y;

      // Change cursor to grabbing
      this.canvas.style.cursor = 'grabbing';
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.draggedNode || !this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Calculate the movement adjusted for zoom
    const deltaX = (x - this.dragStartX) / this.zoomLevel;
    const deltaY = (y - this.dragStartY) / this.zoomLevel;

    // Update node position
    if (typeof this.draggedNode.x === 'number' && typeof this.draggedNode.y === 'number') {
      this.draggedNode.x += deltaX;
      this.draggedNode.y += deltaY;
    }

    // Update drag start position
    this.dragStartX = x;
    this.dragStartY = y;

    // No need to call drawVisualization here, as it's called by the animation loop
  }

  private handleMouseUp(): void {
    this.isDragging = false;
    this.draggedNode = null;

    // Reset cursor
    if (this.canvas) {
      this.canvas.style.cursor = 'default';
    }
  }

  // Touch event handlers for mobile
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (!this.canvas) return;

    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    if (!touch) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const node = this.getNodeAtPosition(x, y);

    if (node) {
      this.isDragging = true;
      this.draggedNode = node;
      this.dragStartX = x;
      this.dragStartY = y;
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (!this.canvas) return;

    if (!this.isDragging || !this.draggedNode || event.touches.length !== 1) return;

    const touch = event.touches[0];
    if (!touch) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Calculate the movement adjusted for zoom
    const deltaX = (x - this.dragStartX) / this.zoomLevel;
    const deltaY = (y - this.dragStartY) / this.zoomLevel;

    // Update node position
    if (typeof this.draggedNode.x === 'number' && typeof this.draggedNode.y === 'number') {
      this.draggedNode.x += deltaX;
      this.draggedNode.y += deltaY;
    }

    // Update drag start position
    this.dragStartX = x;
    this.dragStartY = y;
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    this.isDragging = false;
    this.draggedNode = null;
  }

  private getTagData(): TagNode[] {
    // Get all tags from Obsidian's metadata cache
    const metadataCache = this.plugin.app.metadataCache;
    const files = this.plugin.app.vault.getMarkdownFiles();

    // Tag tracking
    const tagMap = new Map<
      string,
      {
        id: string;
        name: string;
        count: number;
        related: Set<string>;
      }
    >();

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
          related: new Set<string>(),
        });
      } else {
        // Increment count
        const tag = tagMap.get(normalizedTag);
        if (tag) {
          tag.count += 1;
        }
      }

      return { tagName: normalizedTag, tagId };
    };

    // Process each file to collect tags and their relationships
    files.forEach((file) => {
      // Get file's cache
      const fileCache = metadataCache.getFileCache(file);
      if (!fileCache) return;

      // Process frontmatter tags
      const frontmatterTags: string[] = [];
      if (fileCache.frontmatter?.['tags']) {
        // Type guard to handle any value
        const fmTags: unknown = fileCache.frontmatter['tags'];

        if (Array.isArray(fmTags)) {
          fmTags.forEach((tag) => {
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
        fileCache.tags.forEach((tagCache) => {
          const processed = processTag(tagCache.tag);
          if (processed) inlineTags.push(processed.tagName);
        });
      }

      // Combine all tags found in this file
      const fileTags = [...new Set([...frontmatterTags, ...inlineTags])].filter(Boolean);

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
    return Array.from(tagMap.values()).map((tag) => ({
      id: tag.id,
      name: tag.name,
      count: tag.count,
      related: Array.from(tag.related),
    }));
  }
}
