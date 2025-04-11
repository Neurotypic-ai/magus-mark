# Document Integration

The Obsidian Magic plugin provides seamless integration with Obsidian documents, enhancing the editing and viewing experience with advanced tag-related features.

## Frontmatter Enhancement

### Visual Indicators

- Visual indicator in editor when tags are present
- Color-coded tag indicators for different tag categories
- Confidence score visualization next to tags
- Warning indicators for potentially incorrect tags
- AI attribution for automatically generated tags

#### Implementation

```typescript
// Register a CodeMirror extension to detect and style frontmatter tags
import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";

// Define decoration types for different tag categories
const topicTagMark = Decoration.mark({ class: "obsidian-magic-topic-tag" });
const yearTagMark = Decoration.mark({ class: "obsidian-magic-year-tag" });
const lowConfidenceMark = Decoration.mark({ class: "obsidian-magic-low-confidence-tag" });
const aiGeneratedMark = Decoration.mark({ class: "obsidian-magic-ai-generated" });

// Create the view plugin
const tagHighlighter = ViewPlugin.fromClass(class {
  decorations: DecorationSet;
  
  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }
  
  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged)
      this.decorations = this.buildDecorations(update.view);
  }
  
  buildDecorations(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>();
    const tagManager = this.plugin.tagManager;
    
    // Scan the document for the YAML frontmatter section
    const tree = syntaxTree(view.state);
    let inFrontmatter = false;
    
    tree.iterate({
      enter(node) {
        // Detect YAML frontmatter section
        if (node.type.name === "yaml") {
          inFrontmatter = true;
        }
        
        // Process tag nodes within frontmatter
        if (inFrontmatter && node.type.name === "tag") {
          const from = node.from;
          const to = node.to;
          const tagText = view.state.doc.sliceString(from, to);
          
          // Determine tag type and apply appropriate decoration
          const tagInfo = tagManager.getTagInfo(tagText);
          
          if (tagInfo.category === "topic") {
            builder.add(from, to, topicTagMark);
          } else if (tagInfo.category === "year") {
            builder.add(from, to, yearTagMark);
          }
          
          // Add confidence indicator if confidence is low
          if (tagInfo.confidence < 0.7) {
            builder.add(from, to, lowConfidenceMark);
          }
          
          // Mark AI-generated tags
          if (tagInfo.source === "ai") {
            builder.add(from, to, aiGeneratedMark);
          }
        }
      },
      leave(node) {
        if (node.type.name === "yaml") {
          inFrontmatter = false;
        }
      }
    });
    
    return builder.finish();
  }
});

// Register the plugin with Obsidian's editor
this.registerEditorExtension([tagHighlighter]);

// Add CSS for styling the tags
const css = `
.obsidian-magic-topic-tag {
  color: var(--color-blue);
  font-weight: bold;
}

.obsidian-magic-year-tag {
  color: var(--color-green);
}

.obsidian-magic-low-confidence-tag {
  text-decoration: wavy underline var(--color-orange);
}

.obsidian-magic-ai-generated:after {
  content: "AI";
  font-size: 0.7em;
  vertical-align: super;
  color: var(--color-purple);
  margin-left: 2px;
}
`;

// Load the styles
this.registerStyles(css);
```

### Syntax Highlighting

- Syntax highlighting for tag sections in frontmatter
- Distinct highlighting for year, life area, topical, and conversation type tags
- Confidence score visualization with color gradients
- Special highlighting for suggested new tags
- Error highlighting for invalid tag formats

#### Implementation

```typescript
// Extend Obsidian's built-in YAML highlighting with custom token types for tags
import { HighlightStyle, tags as t } from "@codemirror/highlight";
import { EditorView } from "@codemirror/view";

// Define custom syntax node types
const customHighlighting = HighlightStyle.define([
  // Year tags (e.g., #year/2023)
  { tag: t.meta, matcher: /year\/\d{4}/g, color: "var(--color-green)" },
  
  // Life area tags (e.g., #life/work)
  { tag: t.meta, matcher: /life\/[a-z-]+/g, color: "var(--color-yellow)" },
  
  // Topic tags (e.g., #topic/technology/ai)
  { tag: t.meta, matcher: /topic\/[a-z-]+\/[a-z-]+/g, color: "var(--color-blue)" },
  
  // Conversation type tags (e.g., #conversation/brainstorming)
  { tag: t.meta, matcher: /conversation\/[a-z-]+/g, color: "var(--color-purple)" },
  
  // Invalid tag format
  { tag: t.invalid, color: "var(--color-red)" }
]);

// Register the custom highlighting with the editor
this.registerEditorExtension(customHighlighting);

// Use a language extension to validate tag formats and mark invalid ones
import { parseMixed } from "@lezer/common";
import { StreamLanguage } from "@codemirror/language";

// Custom parser to detect and flag invalid tag formats
const tagValidator = StreamLanguage.define({
  // Implementation of tag validation logic
  token(stream, state) {
    // If we're in a tag section
    if (state.inTags) {
      // Check for valid tag formats using regex patterns
      const yearPattern = /^#year\/\d{4}$/;
      const lifePattern = /^#life\/[a-z-]+$/;
      const topicPattern = /^#topic\/[a-z-]+\/[a-z-]+$/;
      const conversationPattern = /^#conversation\/[a-z-]+$/;
      
      const tag = stream.match(/#[^\s:]+/);
      
      if (tag) {
        const tagStr = tag[0];
        if (yearPattern.test(tagStr) || 
            lifePattern.test(tagStr) ||
            topicPattern.test(tagStr) ||
            conversationPattern.test(tagStr)) {
          return "meta";
        } else {
          return "invalid";
        }
      }
    }
    
    // Rest of the parser implementation...
  }
});

this.registerEditorExtension(tagValidator);
```

### Autocompletion

- Autocompletion for existing tags while typing
- Intelligent suggestions based on content and context
- Hierarchical autocompletion for domain/subdomain pairs
- Contextual tag suggestions based on document content
- Keyboard navigation through tag suggestions

#### Implementation

```typescript
// Register a custom autocomplete provider for tags
import { autocompletion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";

// Access to plugin's tag taxonomy 
const tagTaxonomy = this.plugin.tagManager.taxonomy;

// Create the autocomplete source
const tagCompletion = (context: CompletionContext): CompletionResult | null => {
  // Only provide completions in frontmatter section
  const tree = syntaxTree(context.state);
  const node = tree.resolveInner(context.pos, -1);
  
  if (!node || !node.parent || node.parent.name !== "yaml") return null;
  
  // Check if we're typing a tag
  const line = context.state.doc.lineAt(context.pos);
  const lineText = line.text.slice(0, context.pos - line.from);
  
  // Match start of a tag or continuation of a tag hierarchy
  const tagMatch = lineText.match(/(^|\s)(#[a-z\/]*)?$/);
  if (!tagMatch) return null;
  
  const tagPrefix = tagMatch[2] || "#";
  const isHierarchical = tagPrefix.includes("/");
  
  let options = [];
  
  // If we're in a hierarchical tag, suggest appropriate completions based on the hierarchy
  if (isHierarchical) {
    const parts = tagPrefix.slice(1).split("/");
    const category = parts[0];
    
    if (category === "topic" && parts.length === 2) {
      // Suggest subdomains for the selected domain
      const domain = parts[1];
      const subdomains = tagTaxonomy.getSubdomains(domain);
      
      options = subdomains.map(subdomain => ({
        label: `#topic/${domain}/${subdomain}`,
        type: "tag",
        info: tagTaxonomy.getDescription(`topic/${domain}/${subdomain}`),
        apply: `#topic/${domain}/${subdomain}`
      }));
    } else if (parts.length === 1) {
      // Suggest next level based on category
      if (category === "year") {
        const years = ["2020", "2021", "2022", "2023", "2024"];
        options = years.map(year => ({
          label: `#year/${year}`,
          type: "tag",
          apply: `#year/${year}`
        }));
      } else if (category === "life") {
        const areas = ["work", "personal", "health", "learning", "projects"];
        options = areas.map(area => ({
          label: `#life/${area}`,
          type: "tag",
          apply: `#life/${area}`
        }));
      } else if (category === "topic") {
        const domains = tagTaxonomy.getDomains();
        options = domains.map(domain => ({
          label: `#topic/${domain}`,
          type: "tag",
          info: `Select to see ${domain} subdomains`,
          apply: `#topic/${domain}/`
        }));
      }
    }
  } else {
    // Suggest top-level categories
    options = [
      {
        label: "#year/",
        type: "tag",
        info: "Chronological classification",
        apply: "#year/"
      },
      {
        label: "#life/",
        type: "tag",
        info: "Life area classification",
        apply: "#life/"
      },
      {
        label: "#topic/",
        type: "tag",
        info: "Topical classification",
        apply: "#topic/"
      },
      {
        label: "#conversation/",
        type: "tag",
        info: "Conversation type classification",
        apply: "#conversation/"
      }
    ];
    
    // Add document-specific tag suggestions based on content analysis
    const docContent = context.state.doc.toString();
    const suggestedTags = this.plugin.tagAnalyzer.analyzeContent(docContent);
    
    suggestedTags.forEach(tag => {
      options.push({
        label: `#${tag.path}`,
        type: "tag",
        info: `Suggested (${Math.round(tag.confidence * 100)}% confidence)`,
        apply: `#${tag.path}`,
        boost: tag.confidence
      });
    });
  }
  
  return {
    from: context.pos - tagPrefix.length,
    options,
    span: /^[a-z0-9\/\-_]+$/
  };
};

// Register the autocomplete extension
this.registerEditorExtension(autocompletion({
  override: [tagCompletion],
  defaultKeymap: true,
  icons: false,
  addToOptions: [
    {
      render(completion, state) {
        // Custom rendering of completion items
        const dom = document.createElement("div");
        dom.classList.add("obsidian-magic-tag-completion");
        
        const label = document.createElement("span");
        label.textContent = completion.label;
        dom.appendChild(label);
        
        if (completion.info) {
          const info = document.createElement("span");
          info.classList.add("obsidian-magic-tag-completion-info");
          info.textContent = completion.info;
          dom.appendChild(info);
        }
        
        return dom;
      },
      position: "below"
    }
  ]
}));
```

### Validation

- Validation against the tag taxonomy
- Real-time error checking for invalid tags
- Suggestions for fixing invalid tags
- Warning for tags outside the official taxonomy
- Integration with Obsidian's notice system for validation errors

#### Implementation

```typescript
// Register a post-processor for frontmatter content to validate tags
import { Notice } from "obsidian";

// Hook into the Obsidian editor's save event
this.registerEvent(
  this.app.workspace.on("editor-save", (editor) => {
    // Extract frontmatter
    const content = editor.getValue();
    const frontmatter = this.extractFrontmatter(content);
    
    if (!frontmatter || !frontmatter.tags) return;
    
    // Validate each tag
    const invalidTags = [];
    const suggestedFixes = {};
    
    frontmatter.tags.forEach(tag => {
      // Remove # prefix for validation
      const tagPath = tag.startsWith("#") ? tag.slice(1) : tag;
      const isValid = this.plugin.tagManager.validateTag(tagPath);
      
      if (!isValid) {
        invalidTags.push(tag);
        
        // Generate suggested fixes
        const similarTags = this.plugin.tagManager.findSimilarTags(tagPath);
        if (similarTags.length > 0) {
          suggestedFixes[tag] = similarTags;
        }
      }
    });
    
    // Show validation notices if there are invalid tags
    if (invalidTags.length > 0) {
      let noticeMessage = `Found ${invalidTags.length} invalid tags: ${invalidTags.join(", ")}`;
      
      // If we have suggested fixes, add them to the notice
      if (Object.keys(suggestedFixes).length > 0) {
        noticeMessage += "\n\nSuggested fixes:";
        for (const [badTag, suggestions] of Object.entries(suggestedFixes)) {
          noticeMessage += `\n${badTag} → ${suggestions.slice(0, 3).join(", ")}`;
        }
      }
      
      const notice = new Notice(noticeMessage, 10000); // Show for 10 seconds
      
      // Add a button to fix all automatically
      const buttonEl = notice.noticeEl.createEl("button", {
        text: "Fix All",
        cls: "mod-cta"
      });
      
      buttonEl.addEventListener("click", () => {
        // Implement automatic fixing
        let newContent = content;
        
        Object.entries(suggestedFixes).forEach(([badTag, suggestions]) => {
          if (suggestions.length > 0) {
            // Replace with the top suggestion
            const goodTag = suggestions[0].startsWith("#") ? 
              suggestions[0] : `#${suggestions[0]}`;
            newContent = newContent.replace(badTag, goodTag);
          }
        });
        
        editor.setValue(newContent);
        notice.hide();
        new Notice("Tags fixed automatically");
      });
    }
  })
);

// Helper to extract frontmatter from document content
extractFrontmatter(content: string) {
  const fmRegex = /^---\n([\s\S]*?\n)---/;
  const match = content.match(fmRegex);
  
  if (match && match[1]) {
    try {
      // Parse YAML content
      return yaml.parse(match[1]);
    } catch (e) {
      console.error("Failed to parse frontmatter:", e);
      return null;
    }
  }
  
  return null;
}
```

## Live Preview Integration

### Visual Tag Chips

- Visual tag chips in reading view
- Color-coded by tag category
- Hover effects with additional metadata
- Click actions for tag-related operations
- Drag-and-drop reordering and organization

#### Implementation

```typescript
// Register a post-processor for Markdown that converts tag syntax into visual chips
import { MarkdownPostProcessor } from "obsidian";

// Create a post-processor for tags
const tagChipProcessor: MarkdownPostProcessor = (el, ctx) => {
  // Find all tag elements (they'll be <a> elements with href starting with #)
  const tagElements = el.querySelectorAll('a.tag');
  
  tagElements.forEach((tagEl: HTMLElement) => {
    // Get the tag text without the # prefix
    const tagText = tagEl.textContent.slice(1);
    const tagPath = tagText.split('/');
    
    // Create the chip container
    const chipEl = document.createElement('span');
    chipEl.addClass('obsidian-magic-tag-chip');
    
    // Set category-specific class and styling
    if (tagPath[0] === 'year') {
      chipEl.addClass('obsidian-magic-year-tag');
    } else if (tagPath[0] === 'life') {
      chipEl.addClass('obsidian-magic-life-tag');
    } else if (tagPath[0] === 'topic') {
      chipEl.addClass('obsidian-magic-topic-tag');
    } else if (tagPath[0] === 'conversation') {
      chipEl.addClass('obsidian-magic-conversation-tag');
    }
    
    // Get tag metadata
    const tagInfo = this.plugin.tagManager.getTagInfo(tagText);
    
    // Create inner elements
    const iconEl = document.createElement('span');
    iconEl.addClass('obsidian-magic-tag-icon');
    
    // Use different icons based on tag category
    let iconName = 'tag';
    if (tagPath[0] === 'year') iconName = 'calendar';
    else if (tagPath[0] === 'life') iconName = 'activity';
    else if (tagPath[0] === 'topic') iconName = 'hash';
    else if (tagPath[0] === 'conversation') iconName = 'message-circle';
    
    // Set the Obsidian icon
    iconEl.innerHTML = `<svg class="svg-icon"><use href="#${iconName}"></use></svg>`;
    
    // Create the label element
    const labelEl = document.createElement('span');
    labelEl.addClass('obsidian-magic-tag-label');
    labelEl.textContent = tagPath.slice(1).join('/');
    
    // Assemble the chip
    chipEl.appendChild(iconEl);
    chipEl.appendChild(labelEl);
    
    // Add confidence indicator if available
    if (tagInfo && tagInfo.confidence) {
      const confidenceEl = document.createElement('span');
      confidenceEl.addClass('obsidian-magic-tag-confidence');
      
      // Visual indicator of confidence
      const confidenceValue = Math.round(tagInfo.confidence * 100);
      confidenceEl.innerHTML = `<div class="confidence-bar" style="width: ${confidenceValue}%"></div>`;
      
      chipEl.appendChild(confidenceEl);
    }
    
    // Set up drag-and-drop functionality
    chipEl.setAttribute('draggable', 'true');
    
    chipEl.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', tagText);
      e.dataTransfer.setData('application/obsidian-tag', tagText);
      chipEl.addClass('is-dragging');
    });
    
    chipEl.addEventListener('dragend', () => {
      chipEl.removeClass('is-dragging');
    });
    
    // Set up click handler for filtering
    chipEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Trigger tag search/filter
      this.plugin.tagManager.filterByTag(tagText);
    });
    
    // Replace the original tag element with our custom chip
    tagEl.replaceWith(chipEl);
  });
};

// Register the post processor
this.registerMarkdownPostProcessor(tagChipProcessor);

// Add the CSS for tag chips
const css = `
.obsidian-magic-tag-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 16px;
  padding: 2px 8px;
  margin: 0 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.obsidian-magic-tag-icon {
  margin-right: 4px;
  display: flex;
  align-items: center;
}

.obsidian-magic-tag-confidence {
  width: 20px;
  height: 3px;
  margin-left: 4px;
  background: rgba(0,0,0,0.1);
  border-radius: 2px;
  overflow: hidden;
}

.confidence-bar {
  height: 100%;
  background: var(--interactive-accent);
  border-radius: 2px;
}

.obsidian-magic-year-tag {
  background: rgba(var(--color-green-rgb), 0.1);
  color: var(--color-green);
  border: 1px solid rgba(var(--color-green-rgb), 0.2);
}

.obsidian-magic-life-tag {
  background: rgba(var(--color-yellow-rgb), 0.1);
  color: var(--color-yellow);
  border: 1px solid rgba(var(--color-yellow-rgb), 0.2);
}

.obsidian-magic-topic-tag {
  background: rgba(var(--color-blue-rgb), 0.1);
  color: var(--color-blue);
  border: 1px solid rgba(var(--color-blue-rgb), 0.2);
}

.obsidian-magic-conversation-tag {
  background: rgba(var(--color-purple-rgb), 0.1);
  color: var(--color-purple);
  border: 1px solid rgba(var(--color-purple-rgb), 0.2);
}

.obsidian-magic-tag-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.obsidian-magic-tag-chip.is-dragging {
  opacity: 0.5;
}
`;

this.registerStyles(css);
```

### Hover Tooltips

- Hover tooltips showing tag metadata
- Confidence scores and provenance information
- Timestamp of tag application
- Related tags and documents
- Quick actions for tag operations

#### Implementation

```typescript
// Implement tag tooltips with HoverParent API
import { HoverParent, HoverPopover } from "obsidian";

// Create hover provider for tag chips
class TagTooltipProvider implements HoverParent {
  hoverPopover: HoverPopover;
  
  constructor(private plugin: ObsidianMagicPlugin) {}
  
  // Set up the hover behavior for all tag chips
  registerHoverEvents() {
    // Get all tag chips in the document
    document.on('mouseover', '.obsidian-magic-tag-chip', (event, target: HTMLElement) => {
      // Only create tooltip if we don't already have one
      if (this.hoverPopover) return;
      
      // Extract tag data
      const labelEl = target.querySelector('.obsidian-magic-tag-label');
      if (!labelEl) return;
      
      const tagType = target.className.match(/obsidian-magic-(.*)-tag/)?.[1];
      if (!tagType) return;
      
      const label = labelEl.textContent;
      const fullTag = `${tagType}/${label}`;
      
      // Get detailed tag information
      const tagInfo = this.plugin.tagManager.getTagInfo(fullTag);
      if (!tagInfo) return;
      
      // Create tooltip content
      this.hoverPopover = new HoverPopover(target, this.plugin.app);
      
      const tooltipContent = document.createElement('div');
      tooltipContent.addClass('obsidian-magic-tag-tooltip');
      
      // Tag header
      const headerEl = document.createElement('div');
      headerEl.addClass('obsidian-magic-tooltip-header');
      
      const titleEl = document.createElement('h4');
      titleEl.textContent = fullTag;
      headerEl.appendChild(titleEl);
      
      tooltipContent.appendChild(headerEl);
      
      // Tag metadata
      const metadataEl = document.createElement('div');
      metadataEl.addClass('obsidian-magic-tooltip-metadata');
      
      // Confidence score
      if (tagInfo.confidence) {
        const confidenceEl = document.createElement('div');
        confidenceEl.addClass('metadata-item');
        confidenceEl.innerHTML = `<span class="label">Confidence:</span> <span class="value">${Math.round(tagInfo.confidence * 100)}%</span>`;
        metadataEl.appendChild(confidenceEl);
      }
      
      // Source information
      if (tagInfo.source) {
        const sourceEl = document.createElement('div');
        sourceEl.addClass('metadata-item');
        sourceEl.innerHTML = `<span class="label">Source:</span> <span class="value">${tagInfo.source}</span>`;
        metadataEl.appendChild(sourceEl);
      }
      
      // Creation date
      if (tagInfo.created) {
        const dateEl = document.createElement('div');
        dateEl.addClass('metadata-item');
        const formattedDate = new Date(tagInfo.created).toLocaleString();
        dateEl.innerHTML = `<span class="label">Added:</span> <span class="value">${formattedDate}</span>`;
        metadataEl.appendChild(dateEl);
      }
      
      tooltipContent.appendChild(metadataEl);
      
      // Related tags section
      if (tagInfo.relatedTags && tagInfo.relatedTags.length > 0) {
        const relatedEl = document.createElement('div');
        relatedEl.addClass('obsidian-magic-tooltip-related');
        
        const relatedTitle = document.createElement('h5');
        relatedTitle.textContent = 'Related Tags';
        relatedEl.appendChild(relatedTitle);
        
        const relatedList = document.createElement('div');
        relatedList.addClass('related-tags-list');
        
        tagInfo.relatedTags.slice(0, 5).forEach(relatedTag => {
          const tagEl = document.createElement('span');
          tagEl.addClass('related-tag');
          tagEl.textContent = relatedTag;
          
          // Click handler to navigate to related tag
          tagEl.addEventListener('click', () => {
            this.plugin.tagManager.filterByTag(relatedTag);
            this.hoverPopover.hide();
          });
          
          relatedList.appendChild(tagEl);
        });
        
        relatedEl.appendChild(relatedList);
        tooltipContent.appendChild(relatedEl);
      }
      
      // Related documents
      if (tagInfo.documents && tagInfo.documents.length > 0) {
        const docsEl = document.createElement('div');
        docsEl.addClass('obsidian-magic-tooltip-documents');
        
        const docsTitle = document.createElement('h5');
        docsTitle.textContent = 'Documents with this tag';
        docsEl.appendChild(docsTitle);
        
        const docsList = document.createElement('div');
        docsList.addClass('related-docs-list');
        
        tagInfo.documents.slice(0, 3).forEach(doc => {
          const docEl = document.createElement('div');
          docEl.addClass('related-doc');
          docEl.textContent = doc.title;
          
          // Click handler to open document
          docEl.addEventListener('click', () => {
            this.plugin.app.workspace.openLinkText(doc.path, '', true);
            this.hoverPopover.hide();
          });
          
          docsList.appendChild(docEl);
        });
        
        // Add "view all" link if needed
        if (tagInfo.documents.length > 3) {
          const viewAllEl = document.createElement('div');
          viewAllEl.addClass('view-all-link');
          viewAllEl.textContent = `View all ${tagInfo.documents.length} documents`;
          
          viewAllEl.addEventListener('click', () => {
            this.plugin.tagManager.filterByTag(fullTag);
            this.hoverPopover.hide();
          });
          
          docsList.appendChild(viewAllEl);
        }
        
        docsEl.appendChild(docsList);
        tooltipContent.appendChild(docsEl);
      }
      
      // Quick actions
      const actionsEl = document.createElement('div');
      actionsEl.addClass('obsidian-magic-tooltip-actions');
      
      // Find similar button
      const findSimilarBtn = document.createElement('button');
      findSimilarBtn.addClass('action-button');
      findSimilarBtn.textContent = 'Find Similar Documents';
      findSimilarBtn.addEventListener('click', () => {
        this.plugin.tagManager.findSimilarDocuments(fullTag);
        this.hoverPopover.hide();
      });
      actionsEl.appendChild(findSimilarBtn);
      
      // Remove tag button (if user has edit permission)
      const removeBtn = document.createElement('button');
      removeBtn.addClass('action-button');
      removeBtn.addClass('danger');
      removeBtn.textContent = 'Remove Tag';
      removeBtn.addEventListener('click', () => {
        this.plugin.tagManager.removeTagFromCurrentDocument(fullTag);
        this.hoverPopover.hide();
      });
      actionsEl.appendChild(removeBtn);
      
      tooltipContent.appendChild(actionsEl);
      
      // Set the content to the hover popover
      this.hoverPopover.hoverEl.appendChild(tooltipContent);
    });
    
    // Remove tooltip when mouse leaves
    document.on('mouseout', '.obsidian-magic-tag-chip', (event) => {
      if (this.hoverPopover) {
        this.hoverPopover.hide();
        this.hoverPopover = null;
      }
    });
  }
  
  onload() {
    this.registerHoverEvents();
  }
  
  onunload() {
    // Clean up event listeners
    document.off('mouseover', '.obsidian-magic-tag-chip');
    document.off('mouseout', '.obsidian-magic-tag-chip');
    
    if (this.hoverPopover) {
      this.hoverPopover.hide();
      this.hoverPopover = null;
    }
  }
}

// Register the tooltip provider
const tooltipProvider = new TagTooltipProvider(this);
this.addChild(tooltipProvider);

// Add CSS for tooltips
const tooltipCSS = `
.obsidian-magic-tag-tooltip {
  padding: 10px;
  min-width: 200px;
  max-width: 300px;
}

.obsidian-magic-tooltip-header h4 {
  margin: 0 0 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--background-modifier-border);
}

.obsidian-magic-tooltip-metadata {
  margin-bottom: 10px;
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.metadata-item .label {
  font-weight: 500;
  color: var(--text-muted);
}

.obsidian-magic-tooltip-related h5,
.obsidian-magic-tooltip-documents h5 {
  margin: 10px 0 5px;
  font-size: 0.9em;
  color: var(--text-muted);
}

.related-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.related-tag {
  background: var(--background-modifier-hover);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8em;
  cursor: pointer;
}

.related-tag:hover {
  background: var(--background-modifier-active);
}

.related-doc {
  padding: 4px 0;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-doc:hover {
  color: var(--text-accent);
}

.view-all-link {
  margin-top: 5px;
  color: var(--text-accent);
  font-size: 0.8em;
  cursor: pointer;
}

.obsidian-magic-tooltip-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  justify-content: space-between;
}

.action-button {
  border: none;
  background: var(--interactive-normal);
  color: var(--text-normal);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8em;
}

.action-button:hover {
  background: var(--interactive-hover);
}

.action-button.danger {
  background: rgba(var(--color-red-rgb), 0.1);
  color: var(--color-red);
}

.action-button.danger:hover {
  background: rgba(var(--color-red-rgb), 0.2);
}
`;

this.registerStyles(tooltipCSS);
```

## Contextual Tag Sidebar

### Dynamic Appearance

- Appears when editing a document
- Automatically adjusts based on document content
- Collapsible sections for different tag categories
- Responsive design that adapts to sidebar width
- Keyboard shortcuts for quick access

### Relevant Tags

- Shows relevant tags from similar documents
- Semantic similarity matching for suggestions
- Recent tags for quick application
- Popular tags in the same category
- "You might also consider" tag suggestions

### One-Click Tagging

- Provides one-click tagging options
- Drag-and-drop tags from sidebar to document
- Apply multiple tags with batch selection
- Keyboard shortcuts for common tag operations
- Undo/redo support for tag modifications

### Tag Statistics

- Displays tag statistics for current document
- Confidence scores for applied tags
- Related documents using the same tags
- Tag usage trends across the vault
- Potential tag conflicts or issues

## Advanced Document Features

### Tag-based Formatting

- Custom CSS for documents based on tags
- Theme variations tied to document categories
- Special formatting for different conversation types
- Visual indicators of document importance based on tags
- Custom backgrounds or borders based on life area

### Tag-driven Templates

- Dynamic templates based on detected tags
- Suggested structure based on conversation type
- Content recommendations based on topic tags
- Integration with Obsidian Templates plugin
- Template selection based on document classification

### Cross-document Awareness

- Show related documents based on tag similarity
- Backlink enhancements with tag context
- Tag-based document grouping
- Automatic cross-linking based on tag matches
- Content recommendations based on tag similarity

### Content Generation

- AI-assisted content generation based on tags
- Outline creation based on topic classification
- Summary generation informed by document tags
- Related question suggestions based on topic
- Draft continuation based on conversation type

### Interactive Filtering

- Interactive tag filtering directly from the document
- Click to filter vault by tag
- Shift-click for multi-tag filtering
- Context menu with advanced filter options
- Save filter combinations for future use

#### Implementation

```typescript
// Implement interactive filtering for tag chips
import { Menu, TFile } from "obsidian";

// Extend the tag chip click handler with advanced filtering
const enhanceTagChipInteractivity = () => {
  // Use event delegation for better performance
  document.on('click', '.obsidian-magic-tag-chip', (event: MouseEvent, target: HTMLElement) => {
    // Get tag information
    const labelEl = target.querySelector('.obsidian-magic-tag-label');
    if (!labelEl) return;
    
    const tagType = target.className.match(/obsidian-magic-(.*)-tag/)?.[1];
    if (!tagType) return;
    
    const label = labelEl.textContent;
    const fullTag = `${tagType}/${label}`;
    
    // Different behavior based on modifier keys
    if (event.shiftKey) {
      // Shift+click: Add to multi-tag filter
      this.plugin.tagManager.addToMultiTagFilter(fullTag);
      
      // Visual feedback
      new Notice(`Added ${fullTag} to filter`);
      
      // Highlight all tags that are part of the current filter
      document.querySelectorAll('.obsidian-magic-tag-chip').forEach((el: HTMLElement) => {
        const elLabel = el.querySelector('.obsidian-magic-tag-label')?.textContent;
        const elType = el.className.match(/obsidian-magic-(.*)-tag/)?.[1];
        
        if (elLabel && elType) {
          const elTag = `${elType}/${elLabel}`;
          if (this.plugin.tagManager.isTagInCurrentFilter(elTag)) {
            el.addClass('is-filtered');
          } else {
            el.removeClass('is-filtered');
          }
        }
      });
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd+click: Exclude tag from results
      this.plugin.tagManager.excludeTagFromFilter(fullTag);
      new Notice(`Excluding ${fullTag} from results`);
    } else {
      // Normal click: Filter by single tag
      this.plugin.tagManager.filterByTag(fullTag);
    }
    
    event.preventDefault();
    event.stopPropagation();
  });
  
  // Right-click context menu
  document.on('contextmenu', '.obsidian-magic-tag-chip', (event: MouseEvent, target: HTMLElement) => {
    // Get tag information
    const labelEl = target.querySelector('.obsidian-magic-tag-label');
    if (!labelEl) return;
    
    const tagType = target.className.match(/obsidian-magic-(.*)-tag/)?.[1];
    if (!tagType) return;
    
    const label = labelEl.textContent;
    const fullTag = `${tagType}/${label}`;
    
    // Create and show context menu
    const menu = new Menu();
    
    // Filter options
    menu.addItem((item) => {
      item.setTitle("Filter by this tag")
         .setIcon("search")
         .onClick(() => this.plugin.tagManager.filterByTag(fullTag));
    });
    
    menu.addItem((item) => {
      item.setTitle("Add to current filter")
         .setIcon("plus-circle")
         .onClick(() => this.plugin.tagManager.addToMultiTagFilter(fullTag));
    });
    
    menu.addItem((item) => {
      item.setTitle("Exclude from results")
         .setIcon("minus-circle")
         .onClick(() => this.plugin.tagManager.excludeTagFromFilter(fullTag));
    });
    
    menu.addSeparator();
    
    // Tag management
    menu.addItem((item) => {
      item.setTitle("Find similar documents")
         .setIcon("book-open")
         .onClick(() => this.plugin.tagManager.findSimilarDocuments(fullTag));
    });
    
    menu.addItem((item) => {
      item.setTitle("View tag relationships")
         .setIcon("git-branch")
         .onClick(() => this.plugin.tagManager.showTagRelationships(fullTag));
    });
    
    menu.addSeparator();
    
    // Saved filters
    menu.addItem((item) => {
      item.setTitle("Save current filter")
         .setIcon("save")
         .onClick(() => {
           // Prompt for filter name
           const currentFilter = this.plugin.tagManager.getCurrentFilter();
           if (!currentFilter || currentFilter.tags.length === 0) {
             new Notice("No active filter to save");
             return;
           }
           
           const modal = new SaveFilterModal(this.plugin.app, currentFilter, (name) => {
             this.plugin.tagManager.saveFilter(name, currentFilter);
             new Notice(`Filter saved as "${name}"`);
           });
           
           modal.open();
         });
    });
    
    // Show saved filters submenu if available
    const savedFilters = this.plugin.tagManager.getSavedFilters();
    if (savedFilters && Object.keys(savedFilters).length > 0) {
      menu.addItem((item) => {
        item.setTitle("Apply saved filter")
           .setIcon("filter")
           .setSubmenu();
        
        // Add each saved filter as a submenu item
        for (const [name, filter] of Object.entries(savedFilters)) {
          const submenu = item.setSubmenu();
          submenu.addItem((subItem) => {
            subItem.setTitle(name)
                 .onClick(() => {
                   this.plugin.tagManager.applyFilter(filter);
                   new Notice(`Applied filter "${name}"`);
                 });
          });
        }
      });
    }
    
    menu.showAtMouseEvent(event);
    event.preventDefault();
    event.stopPropagation();
  });
};

// Create a modal for saving filters
class SaveFilterModal extends Modal {
  private nameInputEl: HTMLInputElement;
  
  constructor(
    app: App, 
    private filter: TagFilter,
    private onSubmit: (name: string) => void
  ) {
    super(app);
  }
  
  onOpen() {
    const { contentEl } = this;
    
    contentEl.createEl('h2', { text: 'Save Filter' });
    
    // Show filter preview
    const previewEl = contentEl.createEl('div', { cls: 'filter-preview' });
    
    if (this.filter.tags.length > 0) {
      previewEl.createEl('div', { text: 'Included tags:' });
      const includedList = previewEl.createEl('ul');
      
      this.filter.tags.forEach(tag => {
        includedList.createEl('li', { text: tag });
      });
    }
    
    if (this.filter.excludedTags && this.filter.excludedTags.length > 0) {
      previewEl.createEl('div', { text: 'Excluded tags:' });
      const excludedList = previewEl.createEl('ul');
      
      this.filter.excludedTags.forEach(tag => {
        excludedList.createEl('li', { text: tag });
      });
    }
    
    // Name input
    contentEl.createEl('label', { text: 'Filter Name:' });
    this.nameInputEl = contentEl.createEl('input', {
      type: 'text',
      placeholder: 'My Saved Filter'
    });
    
    this.nameInputEl.focus();
    
    // Buttons
    const buttonContainer = contentEl.createEl('div', { cls: 'button-container' });
    
    buttonContainer.createEl('button', { text: 'Cancel' })
      .addEventListener('click', () => this.close());
    
    buttonContainer.createEl('button', { 
      text: 'Save',
      cls: 'mod-cta'
    }).addEventListener('click', () => {
      const name = this.nameInputEl.value.trim();
      if (!name) {
        new Notice('Please enter a name for the filter');
        return;
      }
      
      this.onSubmit(name);
      this.close();
    });
  }
  
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// Add CSS for filter interactivity
const filterInteractivityCSS = `
.obsidian-magic-tag-chip.is-filtered {
  background-color: var(--interactive-accent);
  color: var(--text-on-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.obsidian-magic-tag-chip.is-excluded {
  text-decoration: line-through;
  opacity: 0.7;
}

.filter-preview {
  margin: 10px 0;
  padding: 10px;
  background: var(--background-secondary);
  border-radius: 5px;
}

.filter-preview ul {
  margin: 5px 0 10px 20px;
}

.button-container {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
`;

// Register the interactive filtering functionality
this.registerDomEvent(document, 'DOMContentLoaded', enhanceTagChipInteractivity);
this.addStyle(filterInteractivityCSS);
```

### Tag Relation Visualization

- In-document visualization of tag relationships
- Small inline graph showing related tags
- Expandable to full graph view
- Highlight content related to specific tags
- Show document's position in broader tag network

#### Implementation

```typescript
// Implement tag relation visualization with a mini-graph
import { MarkdownPostProcessor } from "obsidian";
import ForceGraph from 'force-graph';

// Create a post-processor to add the relationship graph after the frontmatter
const tagRelationProcessor: MarkdownPostProcessor = (el, ctx) => {
  // Only process if we're in reading view and the document has tags
  if (!ctx.sourcePath) return;
  
  // Get file from path
  const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
  if (!(file instanceof TFile)) return;
  
  // Check if this is the top of the document
  const isTopLevel = !el.parentElement || el.parentElement.matches('.markdown-reading-view');
  if (!isTopLevel) return;
  
  // Get document metadata
  this.app.metadataCache.getFileCache(file).then(cache => {
    if (!cache || !cache.frontmatter || !cache.frontmatter.tags || cache.frontmatter.tags.length === 0) {
      return; // No tags to visualize
    }
    
    // Create the visualization container
    const graphContainer = document.createElement('div');
    graphContainer.addClass('obsidian-magic-tag-graph-container');
    
    // Add header
    const headerEl = document.createElement('div');
    headerEl.addClass('tag-graph-header');
    
    const titleEl = document.createElement('h4');
    titleEl.textContent = 'Tag Relationships';
    headerEl.appendChild(titleEl);
    
    // Toggle button for expanding/collapsing
    const toggleButton = document.createElement('button');
    toggleButton.addClass('tag-graph-toggle');
    toggleButton.innerHTML = `<svg class="svg-icon"><use href="#expand"></use></svg>`;
    headerEl.appendChild(toggleButton);
    
    graphContainer.appendChild(headerEl);
    
    // Create the graph canvas
    const graphEl = document.createElement('div');
    graphEl.addClass('tag-graph-canvas');
    graphContainer.appendChild(graphEl);
    
    // Insert the graph after the frontmatter
    const firstHeading = el.querySelector('h1, h2');
    if (firstHeading) {
      firstHeading.before(graphContainer);
    } else {
      el.prepend(graphContainer);
    }
    
    // Initialize collapsed state
    let isExpanded = false;
    graphEl.style.height = '120px';
    
    // Toggle expand/collapse on click
    toggleButton.addEventListener('click', () => {
      isExpanded = !isExpanded;
      
      if (isExpanded) {
        graphEl.style.height = '300px';
        toggleButton.innerHTML = `<svg class="svg-icon"><use href="#collapse"></use></svg>`;
        // Redraw graph with more detail when expanded
        renderGraph(graphEl, cache.frontmatter.tags, true);
      } else {
        graphEl.style.height = '120px';
        toggleButton.innerHTML = `<svg class="svg-icon"><use href="#expand"></use></svg>`;
        // Redraw simplified graph when collapsed
        renderGraph(graphEl, cache.frontmatter.tags, false);
      }
    });
    
    // Initialize the graph
    renderGraph(graphEl, cache.frontmatter.tags, false);
  });
};

// Helper function to render the force-directed graph
function renderGraph(container, documentTags, isDetailed) {
  // Get tag relationships data
  const tagData = this.plugin.tagManager.getTagRelationships(documentTags);
  
  // Format data for force-graph
  const graphData = {
    nodes: [],
    links: []
  };
  
  // Add current document tags as primary nodes
  documentTags.forEach(tag => {
    graphData.nodes.push({
      id: tag,
      name: tag,
      val: 10, // Make document tags larger
      color: getTagColor(tag),
      isPrimary: true
    });
  });
  
  // Add related tags and connections
  Object.entries(tagData.relatedTags).forEach(([tag, relatedTags]) => {
    // Add related tag nodes if they don't exist yet
    relatedTags.forEach(relatedTag => {
      // Only add if not already in the nodes list
      if (!graphData.nodes.some(node => node.id === relatedTag.tag)) {
        graphData.nodes.push({
          id: relatedTag.tag,
          name: relatedTag.tag,
          val: 5,
          color: getTagColor(relatedTag.tag),
          isPrimary: false
        });
      }
      
      // Add the link
      graphData.links.push({
        source: tag,
        target: relatedTag.tag,
        value: relatedTag.strength
      });
    });
  });
  
  // If not detailed, limit the number of nodes for better performance
  if (!isDetailed && graphData.nodes.length > 15) {
    // Sort related tags by connection strength
    const sortedNodes = graphData.nodes
      .filter(node => !node.isPrimary)
      .sort((a, b) => {
        const aStrength = graphData.links
          .filter(link => link.source === a.id || link.target === a.id)
          .reduce((sum, link) => sum + link.value, 0);
        
        const bStrength = graphData.links
          .filter(link => link.source === b.id || link.target === b.id)
          .reduce((sum, link) => sum + link.value, 0);
        
        return bStrength - aStrength;
      });
    
    // Keep only the top related tags
    const nodesToKeep = sortedNodes.slice(0, 10).map(node => node.id);
    
    // Filter nodes and links
    graphData.nodes = graphData.nodes.filter(node => 
      node.isPrimary || nodesToKeep.includes(node.id)
    );
    
    graphData.links = graphData.links.filter(link => 
      graphData.nodes.some(node => node.id === link.source) && 
      graphData.nodes.some(node => node.id === link.target)
    );
  }
  
  // Create the force graph
  const graph = ForceGraph()(container)
    .graphData(graphData)
    .nodeLabel('name')
    .nodeColor('color')
    .nodeVal('val')
    .linkWidth(link => link.value * 2)
    .linkColor(() => 'rgba(var(--interactive-accent-rgb), 0.3)')
    .onNodeClick(node => {
      // Navigate to tag search on click
      this.plugin.tagManager.filterByTag(node.id);
    })
    .width(container.clientWidth)
    .height(container.clientHeight);
  
  // Adjust physics settings based on detailed view
  if (isDetailed) {
    graph
      .d3AlphaDecay(0.01)
      .d3VelocityDecay(0.1)
      .linkDirectionalParticles(2)
      .linkDirectionalParticleWidth(link => link.value * 2);
  } else {
    graph
      .d3AlphaDecay(0.02)
      .d3VelocityDecay(0.2);
  }
  
  // Add zoom control for detailed view
  if (isDetailed) {
    graph.controls().enableZoom(true);
  } else {
    graph.controls().enableZoom(false);
  }
  
  return graph;
}

// Helper to determine color based on tag type
function getTagColor(tag) {
  if (tag.startsWith('year/')) {
    return 'var(--color-green)';
  } else if (tag.startsWith('life/')) {
    return 'var(--color-yellow)';
  } else if (tag.startsWith('topic/')) {
    return 'var(--color-blue)';
  } else if (tag.startsWith('conversation/')) {
    return 'var(--color-purple)';
  }
  return 'var(--text-normal)';
}

// Register the post processor for tag relationship visualization
this.registerMarkdownPostProcessor(tagRelationProcessor, -100); // Lower priority to run after other processors

// Add CSS for the tag relationship graph
const tagGraphCSS = `
.obsidian-magic-tag-graph-container {
  margin: 20px 0;
  border: 1px solid var(--background-modifier-border);
  border-radius: 8px;
  overflow: hidden;
}

.tag-graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--background-secondary);
  border-bottom: 1px solid var(--background-modifier-border);
}

.tag-graph-header h4 {
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
}

.tag-graph-toggle {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  color: var(--text-muted);
}

.tag-graph-toggle:hover {
  background: var(--background-modifier-hover);
}

.tag-graph-canvas {
  width: 100%;
  transition: height 0.3s ease;
  background: var(--background-primary);
}

/* Force-graph tooltips */
.graph-tooltip {
  background: var(--background-secondary);
  color: var(--text-normal);
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  pointer-events: none;
}
`;

this.addStyle(tagGraphCSS);
```

## Contextual Tag Sidebar

### Dynamic Appearance

- Appears when editing a document
- Automatically adjusts based on document content
- Collapsible sections for different tag categories
- Responsive design that adapts to sidebar width
- Keyboard shortcuts for quick access

### Relevant Tags

- Shows relevant tags from similar documents
- Semantic similarity matching for suggestions
- Recent tags for quick application
- Popular tags in the same category
- "You might also consider" tag suggestions

### One-Click Tagging

- Provides one-click tagging options
- Drag-and-drop tags from sidebar to document
- Apply multiple tags with batch selection
- Keyboard shortcuts for common tag operations
- Undo/redo support for tag modifications

### Tag Statistics

- Displays tag statistics for current document
- Confidence scores for applied tags
- Related documents using the same tags
- Tag usage trends across the vault
- Potential tag conflicts or issues

## Advanced Document Features

### Tag-based Formatting

- Custom CSS for documents based on tags
- Theme variations tied to document categories
- Special formatting for different conversation types
- Visual indicators of document importance based on tags
- Custom backgrounds or borders based on life area

### Tag-driven Templates

- Dynamic templates based on detected tags
- Suggested structure based on conversation type
- Content recommendations based on topic tags
- Integration with Obsidian Templates plugin
- Template selection based on document classification

### Cross-document Awareness

- Show related documents based on tag similarity
- Backlink enhancements with tag context
- Tag-based document grouping
- Automatic cross-linking based on tag matches
- Content recommendations based on tag similarity

### Content Generation

- AI-assisted content generation based on tags
- Outline creation based on topic classification
- Summary generation informed by document tags
- Related question suggestions based on topic
- Draft continuation based on conversation type 