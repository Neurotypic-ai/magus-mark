import { beforeEach, describe, expect, it, vi } from 'vitest';

import { taxonomyCommand } from './taxonomy';

import type { Argv } from 'yargs';

// Mock dependencies
vi.mock('fs-extra', () => ({
  outputFile: vi.fn().mockResolvedValue(undefined),
}));

// Mock logger
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  success: vi.fn(), // Added success for the reverted command structure
};

vi.mock('@magus-mark/core/utils/Logger', () => ({
  Logger: {
    getInstance: vi.fn().mockReturnValue(mockLogger),
  },
}));

// Mock config - not directly used by the reverted command structure
const mockConfig = {
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock('../utils/config', () => ({
  config: mockConfig,
}));

// Mock core initializeCore and taxonomyManager
const mockTaxonomyManager = {
  getTaxonomy: vi.fn().mockReturnValue({
    domains: ['technology', 'science'],
    contextualTags: ['important', 'urgent'],
    lifeAreas: ['work', 'personal'],
    conversationTypes: ['question', 'discussion'],
  }),
  getSubdomains: vi.fn().mockImplementation((domain) => {
    if (domain === 'technology') return ['ai', 'webdev'];
    return [];
  }),
  hasDomain: vi.fn().mockReturnValue(true),
  addDomain: vi.fn(),
  hasSubdomain: vi.fn().mockReturnValue(false),
  addSubdomain: vi.fn(),
  addContextualTag: vi.fn(),
};

vi.mock('@magus-mark/core', async (importOriginal) => {
  const original = await importOriginal<typeof import('@magus-mark/core')>();
  return {
    ...original,
    initializeCore: vi.fn().mockReturnValue({ taxonomyManager: mockTaxonomyManager }),
  };
});

describe('taxonomyCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have the correct command name and description', () => {
    expect(taxonomyCommand.command).toBe('taxonomy');
    expect(taxonomyCommand.describe).toBe('Manage taxonomies');
  });

  it('should define subcommands in builder', () => {
    const yargsInstance = {
      command: vi.fn().mockReturnThis(), // Mock the command method
      option: vi.fn().mockReturnThis(),
      positional: vi.fn().mockReturnThis(),
      demandCommand: vi.fn().mockReturnThis(),
      example: vi.fn().mockReturnThis(),
    } as unknown as Argv;

    const builderFn = taxonomyCommand.builder as (yargs: Argv) => Argv;
    builderFn(yargsInstance);

    // Check that the subcommand 'list' was added
    expect(yargsInstance.command).toHaveBeenCalledWith(expect.objectContaining({ command: 'list' }));
    // Check that the subcommand 'add-domain' was added
    expect(yargsInstance.command).toHaveBeenCalledWith(expect.objectContaining({ command: 'add-domain <domain>' }));
    // Check other subcommands similarly
    expect(yargsInstance.command).toHaveBeenCalledWith(
      expect.objectContaining({ command: 'add-subdomain <domain> <subdomain>' })
    );
    expect(yargsInstance.command).toHaveBeenCalledWith(expect.objectContaining({ command: 'add-tag <tag>' }));
  });

  // --- Tests for subcommands ---

  it('list subcommand should display taxonomy information', async () => {
    // Find the list command configuration
    const yargsMock = { command: vi.fn() };
    (taxonomyCommand.builder as (yargs: any) => any)(yargsMock);
    const listCommandConfig = yargsMock.command.mock.calls.find((call) => call[0].command === 'list')?.[0];

    expect(listCommandConfig).toBeDefined();
    if (!listCommandConfig?.handler) throw new Error('List handler not found');

    // Execute the handler
    await listCommandConfig.handler({});

    // Verify taxonomyManager methods were called
    expect(mockTaxonomyManager.getTaxonomy).toHaveBeenCalled();
    expect(mockTaxonomyManager.getSubdomains).toHaveBeenCalledWith('technology');

    // Verify console.log was called (can't easily verify chalk output)
    expect(console.log).toHaveBeenCalled();
  });

  it('add-domain subcommand should add a domain', async () => {
    const yargsMock = { command: vi.fn() };
    (taxonomyCommand.builder as (yargs: any) => any)(yargsMock);
    const addDomainCommandConfig = yargsMock.command.mock.calls.find(
      (call) => call[0].command === 'add-domain <domain>'
    )?.[0];

    expect(addDomainCommandConfig).toBeDefined();
    if (!addDomainCommandConfig?.handler) throw new Error('Add-domain handler not found');

    // Mock hasDomain to return false initially
    mockTaxonomyManager.hasDomain.mockReturnValueOnce(false);

    // Execute the handler
    await addDomainCommandConfig.handler({ domain: 'new-domain' });

    // Verify taxonomyManager methods were called
    expect(mockTaxonomyManager.hasDomain).toHaveBeenCalledWith('new-domain');
    expect(mockTaxonomyManager.addDomain).toHaveBeenCalledWith('new-domain');
    expect(mockLogger.success).toHaveBeenCalledWith(expect.stringContaining('Added domain'));
  });

  // Add similar tests for 'add-subdomain' and 'add-tag' subcommands...
});
