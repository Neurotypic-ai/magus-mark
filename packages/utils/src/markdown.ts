/**
 * Markdown utility functions for Obsidian Magic
 */

/**
 * Extracts YAML frontmatter from a markdown document
 * @param content - Markdown content
 * @returns Frontmatter string or null if not found
 */
export function extractFrontmatter(content: string): string | null {
  const match = /^---\n([\s\S]*?)\n---/.exec(content);
  return match?.[1] ? match[1] : null;
}

/**
 * Removes YAML frontmatter from a markdown document
 * @param content - Markdown content
 * @returns Content without frontmatter
 */
export function removeFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n?/, '');
}

/**
 * Converts YAML frontmatter string to a JavaScript object
 * @param frontmatter - YAML frontmatter string
 * @returns Parsed frontmatter object
 */
export function parseFrontmatter(frontmatter: string): Record<string, unknown> {
  try {
    // This is a simplified implementation
    // In a real implementation, we would properly parse the YAML
    const result: Record<string, unknown> = {};
    const lines = frontmatter.split('\n');

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
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
    }

    return result;
  } catch (error) {
    console.error('Error parsing frontmatter:', error);
    return {};
  }
}

/**
 * Format a frontmatter object into YAML string
 * @param frontmatter - Frontmatter object to format
 * @returns Formatted YAML string
 */
export function formatFrontmatter(frontmatter: Record<string, unknown>): string {
  // This is a simplified implementation
  // In a real implementation, we would properly format YAML
  return Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return `${key}: []`;
        } else if (value.length === 1) {
          return `${key}: [${value[0]}]`;
        } else {
          return `${key}:\n${value.map((v) => `  - ${v}`).join('\n')}`;
        }
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested objects (simplified)
        return `${key}:\n  ${JSON.stringify(value)}`;
      } else {
        return `${key}: ${value}`;
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
export function updateFrontmatter(content: string, frontmatter: Record<string, unknown>): string {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = frontmatterRegex.exec(content);

  if (!match) {
    // No existing frontmatter, create new one
    const formattedFrontmatter = formatFrontmatter(frontmatter);
    return `---\n${formattedFrontmatter}\n---\n\n${content}`;
  }

  try {
    // Parse existing frontmatter and merge with new
    const existing = parseFrontmatter(match[1] || '');
    const updated = { ...existing, ...frontmatter };

    // Format and replace frontmatter
    const formattedFrontmatter = formatFrontmatter(updated);
    return content.replace(frontmatterRegex, `---\n${formattedFrontmatter}\n---`);
  } catch (error) {
    console.error('Error updating frontmatter:', error);
    return content;
  }
}
