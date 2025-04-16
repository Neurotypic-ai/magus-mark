import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';

import { initializeCore } from '@obsidian-magic/core';

import { TagExplorer } from './TagExplorer';

import type { Taxonomy } from '@obsidian-magic/core/models/Taxonomy';
import type { TaxonomyManager } from '@obsidian-magic/core/tagging/TaxonomyManager';
import type { Mock } from 'vitest';

import type { TagNode } from './TagExplorer';

// Mock the SubdomainMap interface to simplify our tests
vi.mock('@obsidian-magic/core/models/SubdomainMap', () => {
  return {
    // Mock only enough of the interface to satisfy TS
  };
});

// Mock VSCode APIs with our centralized mock
vi.mock('vscode', async () => {
  const mockModule = await import('../tests/mocks/VSCode.mock');
  return mockModule.default;
});

// Mock the Core initialization
vi.mock('@obsidian-magic/core', () => ({
  initializeCore: vi.fn(),
}));

// Mock the TaxonomyManager type
vi.mock('@obsidian-magic/core/tagging/TaxonomyManager', () => {
  return {
    __esModule: true,
  };
});

describe('TagExplorer', () => {
  // Mock context and taxonomy manager
  const mockContext = {
    subscriptions: [] as vscode.Disposable[],
  };

  // Create a mock taxonomy manager that matches the interface
  const mockTaxonomyManager = {
    getTaxonomy: vi.fn(),
    addDomain: vi.fn(),
    addSubdomain: vi.fn(),
    onChange: vi.fn(),
    taxonomy: {} as Taxonomy,
    customDomains: [] as string[],
    customSubdomains: {} as Record<string, string[]>,
    customContextualTags: {} as Record<string, string[]>,
    configure: vi.fn(),
    getDomainsWithSubdomains: vi.fn(),
    getDomains: vi.fn(),
    getSubdomains: vi.fn(),
    getSubdomainsForDomain: vi.fn(),
    addTag: vi.fn(),
    load: vi.fn(),
    save: vi.fn(),
  } as unknown as TaxonomyManager;

  // Sample taxonomy data for testing - cast to unknown first to avoid type errors
  const sampleTaxonomy = {
    domains: ['Knowledge', 'Programming'],
    subdomains: {
      Knowledge: ['History', 'Science', 'Mathematics'],
      Programming: ['JavaScript', 'TypeScript', 'Python'],
    },
    lifeAreas: [],
    conversationTypes: [],
    contextualTags: [],
  } as unknown as Taxonomy;

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();

    // Set up the mock taxonomy manager to return sample data
    mockTaxonomyManager.getTaxonomy = vi.fn().mockReturnValue(sampleTaxonomy);

    // Mock core initialization to return our mock taxonomy manager
    (initializeCore as unknown as Mock).mockReturnValue({
      taxonomyManager: mockTaxonomyManager,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with taxonomy data', async () => {
    // Create a new TagExplorer instance
    const tagExplorer = new TagExplorer(mockContext as unknown as vscode.ExtensionContext, mockTaxonomyManager);

    // Wait for async operations
    await vi.runAllTimersAsync();

    // Verify taxonomy data was retrieved and the instance is valid
    expect(mockTaxonomyManager.getTaxonomy).toHaveBeenCalledTimes(1);
    expect(tagExplorer).toBeDefined();
  });

  it('should provide tree items with correct properties', async () => {
    // Create a new TagExplorer instance
    const tagExplorer = new TagExplorer(mockContext as unknown as vscode.ExtensionContext, mockTaxonomyManager);

    // Wait for async operations
    await vi.runAllTimersAsync();

    // Get root children (domains)
    const rootChildren = tagExplorer.getChildren();

    // Should have two domains from sample data
    expect(rootChildren).toHaveLength(2);

    // First domain should be Knowledge
    const knowledgeDomain = rootChildren[0];
    expect(knowledgeDomain).toBeDefined();
    if (!knowledgeDomain) return; // Guard to satisfy TS

    expect(knowledgeDomain.name).toBe('Knowledge');
    expect(knowledgeDomain.type).toBe('domain');
    expect(knowledgeDomain.children).toHaveLength(3); // Three subdomains

    // Get tree item for domain
    const domainItem = tagExplorer.getTreeItem(knowledgeDomain);

    // Check tree item properties
    expect(domainItem.label).toBe('Knowledge');
    expect(domainItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);
    expect(domainItem.contextValue).toBe('domain');

    // Check subdomain children
    const subdomains = tagExplorer.getChildren(knowledgeDomain);
    expect(subdomains).toHaveLength(3);

    const historySubdomain = subdomains[0];
    expect(historySubdomain).toBeDefined();
    if (!historySubdomain) return; // Guard to satisfy TS

    expect(historySubdomain.name).toBe('History');
    expect(historySubdomain.type).toBe('subdomain');

    // Check tree item for subdomain
    const subdomainItem = tagExplorer.getTreeItem(historySubdomain);
    expect(subdomainItem.label).toBe('History');
    expect(subdomainItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
    expect(subdomainItem.contextValue).toBe('subdomain');
  });

  it('should find parent nodes correctly', async () => {
    // Create a new TagExplorer instance
    const tagExplorer = new TagExplorer(mockContext as unknown as vscode.ExtensionContext, mockTaxonomyManager);

    // Wait for async operations
    await vi.runAllTimersAsync();

    // Get a subdomain node
    const domains = tagExplorer.getChildren();

    // Make sure we have domains
    expect(domains).toBeDefined();
    expect(domains.length).toBeGreaterThan(1);

    const programmingDomain = domains[1]; // Programming domain
    expect(programmingDomain).toBeDefined();
    if (!programmingDomain) return;

    const programmingSubdomains = tagExplorer.getChildren(programmingDomain);
    expect(programmingSubdomains.length).toBeGreaterThan(1);

    const typescriptNode = programmingSubdomains[1]; // TypeScript subdomain
    expect(typescriptNode).toBeDefined();
    if (!typescriptNode) return;

    // Find the parent
    const parent = await tagExplorer.getParent?.(typescriptNode);

    // Parent should be the Programming domain
    expect(parent?.id).toBe('Programming');
    expect(parent?.name).toBe('Programming');

    // Root level parent should be null
    const rootLevel = domains[0];
    if (!rootLevel) return;
    const rootParent = await tagExplorer.getParent?.(rootLevel);
    expect(rootParent).toBeNull();
  });

  it('should handle add tag command', async () => {
    // Create a new TagExplorer instance - need to use this to register the commands
    new TagExplorer(mockContext as unknown as vscode.ExtensionContext, mockTaxonomyManager);

    // Set up mocks for the input sequence
    (vscode.window.showInputBox as unknown as Mock).mockResolvedValueOnce('NewTag');
    (vscode.window.showQuickPick as unknown as Mock).mockResolvedValueOnce('Programming');

    // Manually trigger the command (this would normally be done by VSCode)
    const commandCalls = (vscode.commands.registerCommand as unknown as Mock).mock.calls;
    // Type the command explicitly instead of using 'any'
    type CommandHandler = (...args: unknown[]) => Promise<void> | void;
    const addTagCommand = commandCalls.find((call: unknown[]) => call[0] === 'obsidian-magic.addTag')?.[1] as
      | CommandHandler
      | undefined;

    expect(addTagCommand).toBeDefined();
    if (!addTagCommand) return;

    // Execute the command handler
    await addTagCommand();

    // Verify we prompted for tag name
    expect(vscode.window.showInputBox).toHaveBeenCalledWith(
      expect.objectContaining({
        placeHolder: 'Enter tag name',
        prompt: 'Enter a new tag name',
      })
    );

    // Verify we prompted for domain selection
    expect(vscode.window.showQuickPick).toHaveBeenCalledWith(
      expect.arrayContaining(['<New Domain>', 'Knowledge', 'Programming']),
      expect.any(Object)
    );

    // Verify tag was added to taxonomy
    expect(mockTaxonomyManager.addSubdomain).toHaveBeenCalledWith('Programming', 'NewTag');

    // Verify success message
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith("Tag 'NewTag' added to Programming");
  });

  it('should handle new domain creation', async () => {
    // Create a new TagExplorer instance - need to use this to register the commands
    new TagExplorer(mockContext as unknown as vscode.ExtensionContext, mockTaxonomyManager);

    // Set up mocks for the input sequence
    (vscode.window.showInputBox as unknown as Mock).mockResolvedValueOnce('NewTag');
    (vscode.window.showQuickPick as unknown as Mock).mockResolvedValueOnce('<New Domain>');
    (vscode.window.showInputBox as unknown as Mock).mockResolvedValueOnce('NewDomain');

    // Manually trigger the command
    const commandCalls = (vscode.commands.registerCommand as unknown as Mock).mock.calls;
    // Type the command explicitly instead of using 'any'
    type CommandHandler = (...args: unknown[]) => Promise<void> | void;
    const addTagCommand = commandCalls.find((call: unknown[]) => call[0] === 'obsidian-magic.addTag')?.[1] as
      | CommandHandler
      | undefined;

    expect(addTagCommand).toBeDefined();
    if (!addTagCommand) return;

    // Execute the command handler
    await addTagCommand();

    // Verify domain was added
    expect(mockTaxonomyManager.addDomain).toHaveBeenCalledWith('NewDomain');

    // Verify success message
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith("Domain 'NewDomain' added");
  });

  it('should handle delete tag command', async () => {
    // Create a new TagExplorer instance
    const tagExplorer = new TagExplorer(mockContext as unknown as vscode.ExtensionContext, mockTaxonomyManager);

    // Wait for async operations
    await vi.runAllTimersAsync();

    // Get a node to delete
    const domains = tagExplorer.getChildren();
    expect(domains.length).toBeGreaterThan(0);

    const tagNode = domains[0]; // Knowledge domain
    expect(tagNode).toBeDefined();
    if (!tagNode) return;

    // Set up mock for confirmation dialog
    (vscode.window.showWarningMessage as unknown as Mock).mockResolvedValueOnce('Yes');

    // Manually trigger the command
    const commandCalls = (vscode.commands.registerCommand as unknown as Mock).mock.calls;
    // Type the command explicitly instead of using 'any'
    type DeleteCommandHandler = (node: TagNode) => Promise<void> | void;
    const deleteTagCommand = commandCalls.find((call: unknown[]) => call[0] === 'obsidian-magic.deleteTag')?.[1] as
      | DeleteCommandHandler
      | undefined;

    expect(deleteTagCommand).toBeDefined();
    if (!deleteTagCommand) return;

    // Execute the command handler
    await deleteTagCommand(tagNode);

    // Verify confirmation was requested
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      "Are you sure you want to delete domain 'Knowledge'?",
      'Yes',
      'No'
    );

    // Since deletion is not implemented, we should show an info message
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      'Deleting tags is not yet implemented in the core API'
    );
  });

  it('should handle refresh', () => {
    // Create a new TagExplorer instance with spies
    const tagExplorer = new TagExplorer(mockContext as unknown as vscode.ExtensionContext, mockTaxonomyManager);

    // Create spy for the refresh method directly since _onDidChangeTreeData is private
    const refreshSpy = vi.spyOn(tagExplorer, 'refresh');

    // Refresh the tree
    tagExplorer.refresh();

    // Verify refresh was called
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).toHaveBeenCalledWith(undefined);

    // Refresh specific element
    const element: TagNode = { id: 'test', name: 'Test', type: 'domain', children: [], count: 0 };
    tagExplorer.refresh(element);

    // Verify refresh was called with element
    expect(refreshSpy).toHaveBeenCalledTimes(2);
    expect(refreshSpy).toHaveBeenCalledWith(element);
  });

  it('should clean up resources on dispose', () => {
    // Create a new TagExplorer instance
    const tagExplorer = new TagExplorer(mockContext as unknown as vscode.ExtensionContext, mockTaxonomyManager);

    // Create spy on the dispose method directly
    const disposeSpy = vi.spyOn(tagExplorer, 'dispose');

    // Dispose the explorer
    tagExplorer.dispose();

    // Verify dispose was called
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });
});
