import { vi } from 'vitest';

import type { Document } from '../models/Document';

/**
 * Creates a mock for the FrontmatterProcessor
 */
export const mockFrontmatterProcessor = () => {
  return {
    FrontmatterProcessor: vi.fn().mockImplementation(() => ({
      extractFrontmatter: vi.fn().mockImplementation((content: string): string => {
        // Simple implementation that handles YAML frontmatter
        const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(content);
        if (match?.[1]) {
          return match[1];
        }
        return '';
      }),
      removeFrontmatter: vi.fn().mockImplementation((content: string): string => {
        const match = /^---\n[\s\S]*?\n---\n([\s\S]*)$/.exec(content);
        if (match?.[1]) {
          return match[1];
        }
        return content;
      }),
      parseFrontmatter: vi.fn().mockImplementation((frontmatter: string) => {
        // Very simple mock implementation
        if (!frontmatter) return {};

        const result: Record<string, string | string[]> = {};
        const lines = frontmatter.split('\n');

        for (const line of lines) {
          const parts = line.split(':');
          if (parts.length >= 2) {
            const key = parts[0]?.trim() ?? '';
            const value = parts.slice(1).join(':').trim();
            if (key) {
              result[key] = value;
            }
          }
        }

        return result;
      }),
      updateFrontmatter: vi.fn().mockImplementation((content: string, updates: Record<string, string | string[]>) => {
        return `---\n${Object.entries(updates)
          .map(([key, value]) => `${key}: ${String(value)}`)
          .join('\n')}\n---\n${content}`;
      }),
    })),
  };
};

/**
 * Creates a mock for the DocumentProcessor
 */
export const mockDocumentProcessor = () => {
  return {
    DocumentProcessor: vi.fn().mockImplementation(() => ({
      parseDocument: vi.fn().mockImplementation((id: string, path: string, content: string): Document => {
        return {
          id,
          path,
          content,
          metadata: {
            created: '2023-01-01',
            modified: '2023-01-02',
          },
        };
      }),
      extractContent: vi.fn().mockImplementation((content: string): string => {
        return content;
      }),
      updateDocument: vi.fn().mockImplementation((document: Document, updates: Partial<Document>): Document => {
        return {
          ...document,
          ...updates,
          content: `UPDATED: ${document.content}`,
        };
      }),
      extractMetadata: vi.fn().mockImplementation(() => ({
        created: '2023-01-01',
        modified: '2023-01-02',
      })),
    })),
  };
};
