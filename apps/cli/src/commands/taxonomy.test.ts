// Now import the actual dependencies

// Import the actual modules
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { taxonomyCommand } from './taxonomy';

import type { Argv } from 'yargs';

// Mock modules (before imports)
vi.mock('fs-extra', () => ({
  outputFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@magus-mark/core/utils/Logger', () => ({
  Logger: {
    getInstance: vi.fn().mockReturnValue({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      success: vi.fn(),
    }),
  },
}));

vi.mock('../utils/config', () => ({
  config: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Define interfaces for our mocks
interface TaxonomyData {
  domains: string[];
  contextualTags: string[];
  lifeAreas: string[];
  conversationTypes: string[];
}

interface MockTaxonomyManager {
  getTaxonomy: () => TaxonomyData;
  getSubdomains: (domain: string) => string[];
  hasDomain: (domain: string) => boolean;
  addDomain: (domain: string) => void;
  hasSubdomain: (domain: string, subdomain: string) => boolean;
  addSubdomain: (domain: string, subdomain: string) => void;
  addContextualTag: (tag: string) => void;
}

interface MockCoreReturn {
  taxonomyManager: MockTaxonomyManager;
}

// Create a mock taxonomy manager for testing
const mockTaxonomyManager: MockTaxonomyManager = {
  getTaxonomy: vi.fn().mockReturnValue({
    domains: ['technology', 'science'],
    contextualTags: ['important', 'urgent'],
    lifeAreas: ['work', 'personal'],
    conversationTypes: ['question', 'discussion'],
  }),
  getSubdomains: vi.fn().mockImplementation((domain: string) => {
    if (domain === 'technology') return ['ai', 'webdev'];
    return [];
  }),
  hasDomain: vi.fn().mockReturnValue(true),
  addDomain: vi.fn(),
  hasSubdomain: vi.fn().mockReturnValue(false),
  addSubdomain: vi.fn(),
  addContextualTag: vi.fn(),
};

vi.mock('@magus-mark/core', () => ({
  initializeCore: vi.fn().mockImplementation(
    () =>
      ({
        taxonomyManager: mockTaxonomyManager,
      }) as MockCoreReturn
  ),
}));

// Interface for command handlers
interface CommandHandler {
  handler: (args: Record<string, unknown>) => Promise<void> | void;
}

interface CommandConfig {
  command: string;
  handler: (args: Record<string, unknown>) => Promise<void> | void;
  [key: string]: unknown;
}

describe('taxonomyCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console.log for the list command test
    vi.spyOn(console, 'log').mockImplementation(() => {
      /* intentionally empty for test purposes */
    });
  });

  it('should have the correct command name and description', () => {
    expect(taxonomyCommand.command).toBe('taxonomy');
    expect(taxonomyCommand.describe).toBe('Manage taxonomies');
  });

  it('should define subcommands in builder', () => {
    const yargsInstance = {
      command: vi.fn().mockReturnThis(),
      option: vi.fn().mockReturnThis(),
      positional: vi.fn().mockReturnThis(),
      demandCommand: vi.fn().mockReturnThis(),
      example: vi.fn().mockReturnThis(),
    } as unknown as Argv;

    const builderFn = taxonomyCommand.builder as (yargs: Argv) => Argv;
    builderFn(yargsInstance);

    expect(yargsInstance.command).toHaveBeenCalledWith(expect.objectContaining({ command: 'list' }));
    expect(yargsInstance.command).toHaveBeenCalledWith(expect.objectContaining({ command: 'add-domain <domain>' }));
    expect(yargsInstance.command).toHaveBeenCalledWith(
      expect.objectContaining({ command: 'add-subdomain <domain> <subdomain>' })
    );
    expect(yargsInstance.command).toHaveBeenCalledWith(expect.objectContaining({ command: 'add-tag <tag>' }));
  });

  it('list subcommand should display taxonomy information', async () => {
    // Mock the yargs command method with a simpler approach
    const listHandler: CommandHandler = {
      handler: vi.fn(),
    };

    // Get the builder function from taxonomyCommand
    const builderFn = taxonomyCommand.builder as (yargs: Argv) => Argv;

    // Create a mock yargs object with command handler capture
    const mockYargs = {
      command: vi.fn().mockImplementation((cmd: CommandConfig) => {
        if (cmd.command === 'list') {
          // Save the handler for later invocation
          listHandler.handler = cmd.handler;
        }
        return mockYargs; // For chaining
      }),
      option: vi.fn().mockReturnThis(),
      positional: vi.fn().mockReturnThis(),
      demandCommand: vi.fn().mockReturnThis(),
      example: vi.fn().mockReturnThis(),
    } as unknown as Argv;

    // Execute the builder function with our mock
    builderFn(mockYargs);

    // Ensure we found the list command handler
    expect(mockYargs.command).toHaveBeenCalled();
    expect(listHandler.handler).toBeDefined();

    // Now invoke the handler directly
    await listHandler.handler({});

    // Verify taxonomyManager methods were called
    expect(mockTaxonomyManager.getTaxonomy).toHaveBeenCalled();
    expect(mockTaxonomyManager.getSubdomains).toHaveBeenCalledWith('technology');
    expect(console.log).toHaveBeenCalled();
  });

  it('add-domain subcommand should add a domain', async () => {
    // Mock the yargs command method with a simpler approach
    const addDomainHandler: CommandHandler = {
      handler: vi.fn(),
    };

    // Get the builder function from taxonomyCommand
    const builderFn = taxonomyCommand.builder as (yargs: Argv) => Argv;

    // Create a mock yargs object with command handler capture
    const mockYargs = {
      command: vi.fn().mockImplementation((cmd: CommandConfig) => {
        if (cmd.command === 'add-domain <domain>') {
          // Save the handler for later invocation
          addDomainHandler.handler = cmd.handler;
        }
        return mockYargs; // For chaining
      }),
      option: vi.fn().mockReturnThis(),
      positional: vi.fn().mockReturnThis(),
      demandCommand: vi.fn().mockReturnThis(),
      example: vi.fn().mockReturnThis(),
    } as unknown as Argv;

    // Execute the builder function with our mock
    builderFn(mockYargs);

    // Ensure we found the add-domain command handler
    expect(mockYargs.command).toHaveBeenCalled();
    expect(addDomainHandler.handler).toBeDefined();

    // Override hasDomain for this test - use vitest mock instead of jest
    const hasDomainFn = mockTaxonomyManager.hasDomain as unknown as ReturnType<typeof vi.fn>;
    hasDomainFn.mockReturnValueOnce(false);

    // Now invoke the handler directly
    await addDomainHandler.handler({ domain: 'new-domain' });

    // Verify taxonomyManager methods were called
    expect(mockTaxonomyManager.hasDomain).toHaveBeenCalledWith('new-domain');
    expect(mockTaxonomyManager.addDomain).toHaveBeenCalledWith('new-domain');

    // Verify Logger methods were called - using the mocked implementation
    const logger = (await import('@magus-mark/core/utils/Logger')).Logger.getInstance('cli');
    expect(logger.success).toHaveBeenCalledWith(expect.any(String));
  });
});
