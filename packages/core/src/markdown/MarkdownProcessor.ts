/**
 * Markdown utility class for Obsidian Magic
 */
export class MarkdownProcessor {
  private static instance: MarkdownProcessor | undefined;

  // Private constructor for singleton pattern
  private constructor() {
    // Private constructor implementation
  }

  static getInstance(): MarkdownProcessor {
    MarkdownProcessor.instance ??= new MarkdownProcessor();
    return MarkdownProcessor.instance;
  }

  /**
   * Extracts YAML frontmatter from a markdown document
   * @param content - Markdown content
   * @returns Frontmatter string or null if not found
   */
  extractFrontmatter(content: string): string | null {
    const match = /^---\n([\s\S]*?)\n---/.exec(content);

    if (match === null) {
      // No frontmatter block found
      return null;
    }

    // match[1] contains the captured group (the content between ---)
    // If the block exists but is empty (---\n---), match[1] will be an empty string.
    // If the block doesn't exist, match is null (handled above).
    // Explicitly return empty string if capture group is empty, otherwise return captured content or null.
    if (match[1] === '') {
      return '';
    }

    return match[1] ?? null; // Return captured content or null if capture somehow failed
  }

  /**
   * Removes YAML frontmatter from a markdown document
   * @param content - Markdown content
   * @returns Content without frontmatter
   */
  removeFrontmatter(content: string): string {
    // Make sure to preserve the newlines after removing frontmatter
    return content.replace(/^---\n[\s\S]*?\n---/, '');
  }

  /**
   * Converts YAML frontmatter string to a JavaScript object
   * @param frontmatter - YAML frontmatter string
   * @returns Parsed frontmatter object
   */
  parseFrontmatter(frontmatter: string): Record<string, unknown> {
    try {
      // This is a simplified implementation
      // In a real implementation, we would properly parse the YAML
      const result: Record<string, unknown> = {};
      const lines = frontmatter.split('\n');

      // Add a check for completely empty frontmatter string
      if (frontmatter.trim() === '') {
        return {};
      }

      for (const line of lines) {
        // Skip empty lines
        if (line.trim() === '') continue;

        const colonIndex = line.indexOf(':');
        if (colonIndex <= 0) {
          // Throw an error if a line doesn't contain a colon or starts with it (malformed)
          throw new Error(`Malformed frontmatter line: "${line}"`);
        }
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // Handle array values
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.substring(1, value.length - 1);
          result[key] = value.split(',').map((v) => v.trim());
        } else {
          result[key] = value;
        }
      }

      return result;
    } catch (error) {
      console.error('Error parsing frontmatter:', error);
      // Re-throw the error so the caller (updateFrontmatter) can catch it
      throw new Error(`Failed to parse frontmatter: ${String(error)}`);
      // Alternatively, throw a more specific custom error if available
      // throw new MarkdownError('Failed to parse frontmatter', { cause: error, code: 'PARSE_ERROR' });
    }
  }

  /**
   * Format a frontmatter object into YAML string
   * @param frontmatter - Frontmatter object to format
   * @returns Formatted YAML string
   */
  formatFrontmatter(frontmatter: Record<string, unknown>): string {
    // This is a simplified implementation
    // In a real implementation, we would properly format YAML
    return Object.entries(frontmatter)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return `${key}: []`;
          } else if (value.length === 1) {
            return `${key}: [${String(value[0])}]`;
          } else {
            return `${key}:\n${value.map((v) => `  - ${String(v)}`).join('\n')}`;
          }
        } else if (typeof value === 'object' && value !== null) {
          // Handle nested objects (simplified)
          return `${key}:\n  ${JSON.stringify(value)}`;
        } else {
          return `${key}: ${String(value)}`;
        }
      })
      .join('\n');
  }

  /**
   * Creates or updates frontmatter in markdown content
   * @param content - Markdown content
   * @param frontmatter - Frontmatter data to apply
   * @returns Content with updated frontmatter
   */
  updateFrontmatter(content: string, frontmatter: Record<string, unknown>): string {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = frontmatterRegex.exec(content);

    if (!match) {
      // No existing frontmatter, create new one
      const formattedFrontmatter = this.formatFrontmatter(frontmatter);
      return `---\n${formattedFrontmatter}\n---\n\n${content}`;
    }

    try {
      // Parse existing frontmatter and merge with new
      const existing = this.parseFrontmatter(match[1] ?? '');
      const updated = { ...existing, ...frontmatter };

      // Format and replace frontmatter
      const formattedFrontmatter = this.formatFrontmatter(updated);
      return content.replace(frontmatterRegex, `---\n${formattedFrontmatter}\n---`);
    } catch (error) {
      console.error('Error updating frontmatter:', error);
      // Return the original content with the original frontmatter in case of error
      return content;
    }
  }
}
