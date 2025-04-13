import { describe, it, expect } from 'vitest';
import {
  truncate,
  toKebabCase,
  toCamelCase,
  toPascalCase,
  slugify,
  normalizeLineEndings,
  escapeRegExp,
  sanitizeHtml,
  formatDuration,
  formatCurrency
} from '../src/string';

describe('String Utilities', () => {
  describe('truncate', () => {
    it('should not truncate strings shorter than maxLength', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should truncate strings longer than maxLength', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });
  });

  describe('toKebabCase', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(toKebabCase('helloWorld')).toBe('hello-world');
    });

    it('should convert spaces to hyphens', () => {
      expect(toKebabCase('hello world')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(toKebabCase('hello@world!')).toBe('helloworld');
    });
  });

  describe('toCamelCase', () => {
    it('should convert kebab-case to camelCase', () => {
      expect(toCamelCase('hello-world')).toBe('helloWorld');
    });

    it('should convert spaces to camelCase', () => {
      expect(toCamelCase('hello world')).toBe('helloWorld');
    });
  });

  describe('toPascalCase', () => {
    it('should convert kebab-case to PascalCase', () => {
      expect(toPascalCase('hello-world')).toBe('HelloWorld');
    });

    it('should convert camelCase to PascalCase', () => {
      expect(toPascalCase('helloWorld')).toBe('HelloWorld');
    });
  });

  describe('slugify', () => {
    it('should convert spaces to hyphens', () => {
      expect(slugify('hello world')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(slugify('hello & world!')).toBe('hello-world');
    });

    it('should convert to lowercase', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });
  });

  describe('normalizeLineEndings', () => {
    it('should convert CRLF to LF', () => {
      expect(normalizeLineEndings('hello\r\nworld')).toBe('hello\nworld');
    });

    it('should convert CR to LF', () => {
      expect(normalizeLineEndings('hello\rworld')).toBe('hello\nworld');
    });
  });

  describe('escapeRegExp', () => {
    it('should escape special regex characters', () => {
      expect(escapeRegExp('hello.world')).toBe('hello\\.world');
      expect(escapeRegExp('hello*world')).toBe('hello\\*world');
    });
  });

  describe('sanitizeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeHtml('<div>Hello & "World"</div>')).toBe('&lt;div&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;');
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500.00ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1500)).toBe('1.50s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(125000)).toBe('2m 5s');
    });

    it('should format hours, minutes, and seconds', () => {
      expect(formatDuration(3725000)).toBe('1h 2m 5s');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD currency', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format EUR currency', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
    });
  });
}); 