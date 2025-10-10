import { describe, expect, it } from 'vitest';

import { getAllCommands } from './commands';

describe('getAllCommands', () => {
  it('returns array of all command modules', () => {
    const commands = getAllCommands();
    expect(Array.isArray(commands)).toBe(true);
    expect(commands.length).toBeGreaterThan(0);
  });

  it('each command has required properties', () => {
    const commands = getAllCommands();
    commands.forEach((cmd) => {
      expect(cmd).toHaveProperty('command');
      expect(cmd).toHaveProperty('describe');
      expect(typeof cmd.command).toBe('string');
      expect(typeof cmd.describe).toBe('string');
    });
  });

  it('includes expected core commands', () => {
    const commands = getAllCommands();
    const commandNames = commands.map((c) => c.command);
    expect(commandNames).toContain('tag [paths..]');
    expect(commandNames).toContain('setup');
    expect(commandNames).toContain('test');
    expect(commandNames).toContain('stats');
    expect(commandNames).toContain('taxonomy');
  });
});
