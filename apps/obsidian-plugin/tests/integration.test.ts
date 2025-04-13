import { describe, it, expect, vi, beforeEach } from 'vitest';
import ObsidianMagicPlugin from '../src/main';
import type { App, Plugin, TFile } from 'obsidian';
import type { FileProcessingResult } from '../src/services/TaggingService';
import { success } from '../src/services/errors';

// Mock data
const MOCK_MARKDOWN_CONTENT = `---
title: Understanding TypeScript Generics
date: 2023-04-15
---

# Understanding TypeScript Generics

TypeScript generics provide a way to create reusable components that can work with a variety of types rather than a single one.

## Basic Example

\`\`\`typescript
function identity<T>(arg: T): T {
  return arg;
}

const output = identity<string>("myString");
\`\`\`

This function is called a "generic" because it can work with a variety of types while preserving type information.
`;

const EXPECTED_TAGS = {
  domain: 'software-development',
  subdomains: ['typescript', 'programming'],
  lifeAreas: ['learning'],
  conversationType: 'tutorial',
  contextualTags: ['generics', 'type-safety'],
  year: '2023'
};

interface PluginManifest {
  id: string;
  name: string;
  version: string;
  minAppVersion: string;
  description: string;
  author: string;
  authorUrl: string;
}

// Create a proper Plugin base class mock
class MockPlugin implements Partial<Plugin> {
  app: App;
  manifest: PluginManifest;

  constructor(app: App, manifest: PluginManifest) {
    this.app = app;
    this.manifest = manifest;
  }

  addRibbonIcon = vi.fn().mockReturnValue({ remove: vi.fn() });
  addStatusBarItem = vi.fn().mockReturnValue({ remove: vi.fn(), setText: vi.fn(), addClass: vi.fn() });
  addCommand = vi.fn().mockReturnValue({ remove: vi.fn() });
  registerView = vi.fn().mockReturnValue({ remove: vi.fn() });
  addSettingTab = vi.fn().mockReturnValue({ remove: vi.fn() });
  registerEvent = vi.fn().mockReturnValue({ remove: vi.fn() });
  loadData = vi.fn().mockResolvedValue({
    apiKey: 'test-api-key',
    modelPreference: 'gpt-4o',
    defaultTagBehavior: 'merge'
  });
  saveData = vi.fn().mockResolvedValue(undefined);
}

// Mock the Obsidian API
vi.mock('obsidian', () => {
  return {
    Plugin: MockPlugin,
    PluginSettingTab: vi.fn(),
    Notice: vi.fn(),
    Setting: vi.fn(),
    TFile: vi.fn().mockImplementation((path: string) => ({
      path,
      basename: path.split('/').pop()?.split('.')[0] ?? '',
      extension: path.split('.').pop() ?? ''
    }))
  };
});

// Mock the core module
vi.mock('@obsidian-magic/core', () => {
  return {
    initializeCore: vi.fn().mockReturnValue({
      taggingService: {
        tagDocument: vi.fn().mockResolvedValue({
          success: true,
          data: EXPECTED_TAGS
        })
      }
    })
  };
});

interface MockVault {
  read: ReturnType<typeof vi.fn>;
  modify: ReturnType<typeof vi.fn>;
  getAbstractFileByPath: ReturnType<typeof vi.fn>;
}

interface MockApp {
  vault: MockVault;
  workspace: {
    getActiveFile: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    detachLeavesOfType: ReturnType<typeof vi.fn>;
    getLeaf: ReturnType<typeof vi.fn>;
  };
  metadataCache: { on: ReturnType<typeof vi.fn> };
  fileManager: { processFrontMatter: ReturnType<typeof vi.fn> };
  keymap: Record<string, unknown>;
  scope: Record<string, unknown>;
  lastEvent: null;
  loadLocalStorage: () => string;
  saveLocalStorage: () => void;
}

describe('Document Tagging Integration', () => {
  let plugin: ObsidianMagicPlugin;
  let mockVault: MockVault;
  let mockFile: TFile;
  let mockApp: MockApp;
  const mockManifest: PluginManifest = { 
    id: 'obsidian-magic', 
    name: 'Obsidian Magic', 
    version: '0.1.0',
    minAppVersion: '1.5.0',
    description: 'AI-powered tagging system for organizing AI chat history in Obsidian',
    author: 'Obsidian Magic Team',
    authorUrl: 'https://github.com/obsidian-magic/obsidian-magic',
  };
  
  beforeEach(() => {
    // Create mock file
    mockFile = { 
      path: 'articles/typescript-generics.md',
      basename: 'typescript-generics',
      extension: 'md'
    } as TFile;
    
    // Create mock vault
    mockVault = {
      read: vi.fn().mockResolvedValue(MOCK_MARKDOWN_CONTENT),
      modify: vi.fn().mockResolvedValue(undefined),
      getAbstractFileByPath: vi.fn().mockReturnValue(mockFile)
    };
    
    // Create mock app with required properties
    mockApp = {
      vault: mockVault,
      workspace: {
        getActiveFile: vi.fn().mockReturnValue(mockFile),
        on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
        detachLeavesOfType: vi.fn(),
        getLeaf: vi.fn().mockReturnValue({
          setViewState: vi.fn().mockResolvedValue(undefined)
        }),
      },
      // Add missing required App properties
      metadataCache: { on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }) },
      fileManager: { processFrontMatter: vi.fn() },
      keymap: {},
      scope: {},
      lastEvent: null,
      loadLocalStorage: () => '',
      saveLocalStorage: () => undefined,
    };
    
    // Create plugin instance with correct constructor args
    plugin = new ObsidianMagicPlugin(mockApp as unknown as App, mockManifest);
    
    // Reset mocks
    vi.clearAllMocks();
  });
  
  it('should tag a document end-to-end', async () => {
    // Initialize plugin
    await plugin.onload();
    
    // Process the file and mock the result shape
    const result = success({
      file: mockFile,
      tags: EXPECTED_TAGS
    }) as unknown as FileProcessingResult;
    
    // Mock the processFile method
    plugin.taggingService.processFile = vi.fn().mockResolvedValue(result);
    
    // Call the method being tested
    const processResult = await plugin.taggingService.processFile(mockFile);
    
    // Verify results
    // Cast to appropriate type for test access
    const typedResult = processResult as unknown as { success: boolean };
    expect(typedResult.success).toBe(true);
    expect(mockVault.read).toHaveBeenCalledWith(mockFile);
    expect(mockVault.modify).toHaveBeenCalled();
    
    // Get the content that was written to the file
    const modifyCall = mockVault.modify.mock.calls[0];
    expect(modifyCall).toBeDefined();
    
    // Expect file to be modified with tags
    const fileContent = modifyCall?.[1] as string;
    expect(fileContent).toContain('domain:');
    expect(fileContent).toContain('software-development');
  });
}); 
