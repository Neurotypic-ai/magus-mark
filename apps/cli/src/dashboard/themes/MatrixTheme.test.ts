import { describe, expect, it } from 'vitest';

import { cyberpunkTheme, getTheme, hackerTheme, matrixTheme, minimalTheme } from './MatrixTheme';

describe('MatrixTheme', () => {
  it('exports all theme objects with required properties', () => {
    const themes = [matrixTheme, cyberpunkTheme, hackerTheme, minimalTheme];

    themes.forEach((theme) => {
      expect(theme).toHaveProperty('name');
      expect(theme).toHaveProperty('colors');
      expect(theme).toHaveProperty('style');
      expect(theme.colors).toHaveProperty('primary');
      expect(theme.colors).toHaveProperty('background');
      expect(theme.style).toHaveProperty('bg');
      expect(theme.style).toHaveProperty('fg');
      expect(theme.style.border).toHaveProperty('fg');
    });
  });

  it('getTheme returns requested theme', () => {
    expect(getTheme('matrix')).toBe(matrixTheme);
    expect(getTheme('cyberpunk')).toBe(cyberpunkTheme);
    expect(getTheme('hacker')).toBe(hackerTheme);
    expect(getTheme('minimal')).toBe(minimalTheme);
  });

  it('getTheme falls back to matrix for unknown theme', () => {
    expect(getTheme('unknown-theme')).toBe(matrixTheme);
  });
});
