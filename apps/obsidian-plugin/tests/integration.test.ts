import { describe, it, expect, vi, beforeEach } from 'vitest';
import ObsidianMagicPlugin from '../src/main';
import { DocumentTagService } from '../src/services/DocumentTagService';
import { TaggingService } from '../src/services/TaggingService';
import type { TFile } from 'obsidian';

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

// Create a proper Plugin base class mock
class MockPlugin {
  app: any;
  manifest: any;

  constructor(app: any, manifest: any) {
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
    TFile: vi.fn().mockImplementation((path) => ({
      path,
      basename: path.split('/').pop()?.split('.')[0] || '',
      extension: path.split('.').pop() || ''
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

describe('Document Tagging Integration', () => {
  let plugin: ObsidianMagicPlugin;
  let mockVault: any;
  let mockFile: TFile;
  let mockApp: any;
  const mockManifest = { id: 'obsidian-magic', name: 'Obsidian Magic', version: '0.1.0' };
  
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
    };
    
    // Create plugin instance with correct constructor args
    plugin = new ObsidianMagicPlugin(mockApp, mockManifest);
    
    // Reset mocks
    vi.clearAllMocks();
  });
  
  it('should tag a document end-to-end', async () => {
    // Initialize plugin
    await plugin.onload();
    
    // Process the file
    const result = await plugin.taggingService.processFile(mockFile);
    
    // Verify results
    expect(result.success).toBe(true);
    expect(mockVault.read).toHaveBeenCalledWith(mockFile);
    expect(mockVault.modify).toHaveBeenCalled();
    
    // Get the content that was written to the file
    const modifyCall = mockVault.modify.mock.calls[0];
    expect(modifyCall).toBeDefined();
    
    // Expect file to be modified with tags
    const fileContent = modifyCall[1] as string;
    expect(fileContent).toContain('domain:');
    expect(fileContent).toContain('software-development');
  });
}); 