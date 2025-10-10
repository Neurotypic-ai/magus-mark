import { beforeEach, describe, expect, it } from 'vitest';

import Formatters from './Formatters';

describe('Formatters', () => {
  let formatters: Formatters;

  beforeEach(() => {
    formatters = new Formatters();
  });

  it('formatPath replaces home directory with ~', () => {
    const home = process.env['HOME'] ?? process.env['USERPROFILE'] ?? '~';
    const result = formatters.formatPath(`${home}/Documents/notes`);
    expect(result).toBe('~/Documents/notes');
  });

  it('calculateTokens estimates 1 token per 4 characters', () => {
    expect(formatters.calculateTokens('abcd')).toBe(1);
    expect(formatters.calculateTokens('abcdefgh')).toBe(2);
    expect(formatters.calculateTokens('a')).toBe(1);
  });

  it('formatCurrency formats with 4 decimal places', () => {
    expect(formatters.formatCurrency(0.0123)).toBe('$0.0123');
    expect(formatters.formatCurrency(1.5)).toBe('$1.5000');
  });

  it('formatDuration converts ms to readable format', () => {
    expect(formatters.formatDuration(500)).toBe('500ms');
    expect(formatters.formatDuration(1500)).toBe('1.50s');
    expect(formatters.formatDuration(65000)).toBe('1m 5.0s');
  });
});
