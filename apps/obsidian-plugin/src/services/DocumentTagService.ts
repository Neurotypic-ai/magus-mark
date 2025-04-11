import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, ViewPlugin, WidgetType } from '@codemirror/view';
import { Notice, TFile } from 'obsidian';

import type { DecorationSet, EditorView, ViewUpdate } from '@codemirror/view';

import type ObsidianMagicPlugin from '../main';

/**
 * Tag widget shown in the editor
 */
class TagWidget extends WidgetType {
  private tag: string;
  private onClick: (tag: string) => void;

  constructor(tag: string, onClick: (tag: string) => void) {
    super();
    this.tag = tag;
    this.onClick = onClick;
  }

  toDOM(): HTMLElement {
    const dom = document.createElement('span');
    dom.classList.add('obsidian-magic-tag-widget');

    // Extract tag name without the hash
    const tagName = this.tag.startsWith('#') ? this.tag.substring(1) : this.tag;

    // Create tag chip element
    dom.textContent = tagName;

    // Add click handler
    dom.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onClick(this.tag);
    });

    return dom;
  }
}

/**
 * ViewPlugin for CodeMirror that decorates tags in the document
 */
const tagEditorPlugin = (plugin: ObsidianMagicPlugin) => {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>();

        // Look for tags in the frontmatter or inline tags like #tag
        const tree = syntaxTree(view.state);

        // Process the entire doc to find tag occurrences
        tree.iterate({
          enter: (node: { type: { name: string }; from: number; to: number }) => {
            if (node.type.name === 'hashtag') {
              const from = node.from;
              const to = node.to;
              const tag = view.state.doc.sliceString(from, to);

              // Create decoration for tag
              const decoration = Decoration.replace({
                widget: new TagWidget(tag, (t) => {
                  this.handleTagClick(t);
                }),
                inclusive: true,
              });

              builder.add(from, to, decoration);
            }
          },
        });

        return builder.finish();
      }

      handleTagClick(tag: string) {
        // Use the plugin instance to integrate with the broader plugin functionality
        const file = plugin.app.workspace.getActiveFile();
        if (file) {
          // Open tag management view and focus on this tag
          void plugin
            .activateTagManagementView()
            .then(() => {
              // Display a notice about the clicked tag
              new Notice(`Filtering by tag: ${tag}`);

              // Future enhancement: Send message to the tag management view to filter by this tag
            })
            .catch((error: unknown) => {
              console.error('Error opening tag management view:', error);
              new Notice('Failed to open tag management view');
            });
        } else {
          // Fallback to simple notice if no file is active
          new Notice(`Clicked tag: ${tag}`);
        }
      }
    },
    {
      decorations: (v: { decorations: DecorationSet }) => v.decorations,
    }
  );
};

/**
 * Service for tagging and processing documents
 */
export class DocumentTagService {
  private plugin: ObsidianMagicPlugin;

  constructor(plugin: ObsidianMagicPlugin) {
    this.plugin = plugin;

    // Register editor extensions when plugin is loaded
    this.registerEditorExtensions();

    // Register event handlers
    this.registerEventHandlers();
  }

  /**
   * Register CodeMirror extensions for tag decoration
   */
  private registerEditorExtensions() {
    this.plugin.registerEditorExtension([tagEditorPlugin(this.plugin)]);
  }

  /**
   * Register event handlers for document operations
   */
  private registerEventHandlers() {
    // Register handler for file open
    this.plugin.registerEvent(
      this.plugin.app.workspace.on('file-open', async (file) => {
        if (this.plugin.settings.enableAutoSync) {
          await this.checkAndTagFile(file);
        }
      })
    );

    // Register handler for file save
    this.plugin.registerEvent(
      this.plugin.app.vault.on('modify', (file) => {
        if (this.plugin.settings.enableAutoSync && file instanceof TFile) {
          // Only process if file has been saved for a certain amount of time
          // to avoid processing during active editing
          setTimeout(() => {
            void this.checkAndTagFile(file);
          }, 5000); // 5 second delay to avoid processing during active editing
        }
      })
    );
  }

  /**
   * Check if a file needs tagging and process it if needed
   */
  private async checkAndTagFile(file: TFile | null) {
    if (!file || file.extension !== 'md') return;

    // Check if file has been tagged before or needs re-tagging
    // This is just a placeholder - we need to implement proper caching
    // to avoid unnecessary processing

    // Process the file
    await this.plugin.taggingService.processFile(file);
  }

  /**
   * Get tags from the current editor
   */
  public getTagsFromEditor(editor: EditorView): string[] {
    const tags: string[] = [];
    const text = editor.state.doc.toString();

    // Simple regex to extract tags
    // In a real implementation, we would use the parser to get proper tag nodes
    const tagRegex = /#[a-zA-Z0-9_/]+/g;
    let match;

    while ((match = tagRegex.exec(text)) !== null) {
      tags.push(match[0]);
    }

    return tags;
  }

  /**
   * Add or update a tag in the frontmatter
   */
  public async addTagToFrontmatter(file: TFile, tag: string): Promise<void> {
    // Read file content
    const content = await this.plugin.app.vault.read(file);

    // Parse frontmatter
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = frontmatterRegex.exec(content);

    if (match?.[1]) {
      // Extract frontmatter
      const frontmatter = match[1];

      // Check if tags exist
      const tagsRegex = /tags:\s*\[(.*?)\]/;
      const tagsMatch = tagsRegex.exec(frontmatter);

      let updatedContent: string | undefined;

      if (tagsMatch?.[1] !== undefined) {
        // Tags exist, add new tag if it doesn't exist
        const tags = tagsMatch[1].split(',').map((t) => t.trim());

        // Clean tag name (remove # if present)
        const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;

        if (!tags.includes(cleanTag)) {
          tags.push(cleanTag);
          const updatedTags = `tags: [${tags.join(', ')}]`;
          updatedContent = content.replace(tagsRegex, updatedTags);
        } else {
          // Tag already exists
          return;
        }
      } else {
        // Tags don't exist, add tags section
        const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
        const updatedFrontmatter = `${frontmatter}\ntags: [${cleanTag}]`;
        updatedContent = content.replace(frontmatterRegex, `---\n${updatedFrontmatter}\n---`);
      }

      // Write updated content back to file
      if (updatedContent) {
        await this.plugin.app.vault.modify(file, updatedContent);
      }
    } else {
      // No frontmatter, add one
      const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
      const newFrontmatter = `---\ntags: [${cleanTag}]\n---\n\n${content}`;

      // Write updated content back to file
      await this.plugin.app.vault.modify(file, newFrontmatter);
    }
  }
}
