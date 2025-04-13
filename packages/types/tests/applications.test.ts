import { describe, it, expect, vi } from 'vitest';
import type {
  // Obsidian Plugin Types
  PluginSettings,
  TagVisualization,
  TagFilterQuery,
  TaggedFile,
  TagSuggestion,
  TagFeedback,
  TagStatistics,
  TagEvent,
  
  // VS Code Extension Types
  VSCodeSettings,
  TagDecoration,
  WorkspaceDocument,
  TagTreeNode,
  TagViewState,
  MCPContext,
  CursorDocument,
  CursorCommand
} from '../src';

describe('Application Types', () => {
  describe('Obsidian Plugin Types', () => {
    it('validates plugin settings', () => {
      const settings: PluginSettings = {
        api: {
          apiKey: 'test-api-key',
          apiKeyStorage: 'local',
          defaultModel: 'gpt-4o',
          timeoutMs: 30000,
          maxRetries: 3,
          costPerTokenMap: {
            'gpt-4o': 0.00005
          }
        },
        tagging: {
          model: 'gpt-4o',
          behavior: 'append',
          minConfidence: 0.6,
          reviewThreshold: 0.8,
          generateExplanations: true
        },
        ui: {
          showTagsInFileExplorer: true,
          enableTagHighlighting: true,
          enableTagSuggestions: true,
          showConfidenceScores: false,
          tagDisplayStyle: 'chips'
        },
        sync: {
          enableAutoTagging: true,
          tagOnSave: true,
          tagOnOpen: false,
          syncInterval: 60
        },
        advanced: {
          logLevel: 'info',
          enableMetrics: true,
          useLocalProcessing: false,
          batchSize: 10,
          maxConcurrency: 4
        }
      };
      
      // Type checking verification
      expect(settings.api.defaultModel).toBe('gpt-4o');
      expect(settings.tagging.behavior).toBe('append');
      expect(settings.ui.tagDisplayStyle).toBe('chips');
      expect(settings.sync.syncInterval).toBe(60);
      expect(settings.advanced.logLevel).toBe('info');
      
      // Verify enum values
      const validDisplayStyles: PluginSettings['ui']['tagDisplayStyle'][] = ['chips', 'text', 'both'];
      expect(validDisplayStyles).toContain(settings.ui.tagDisplayStyle);
      
      const validLogLevels: PluginSettings['advanced']['logLevel'][] = ['debug', 'info', 'warn', 'error'];
      expect(validLogLevels).toContain(settings.advanced.logLevel);
    });
    
    it('validates tag visualization', () => {
      const visualization: TagVisualization = {
        color: '#ff5500',
        icon: 'tag-icon',
        priority: 2,
        showInBrowser: true,
        showInEditor: true
      };
      
      expect(visualization.color).toBe('#ff5500');
      expect(visualization.icon).toBe('tag-icon');
      expect(visualization.priority).toBe(2);
      expect(visualization.showInBrowser).toBe(true);
      expect(visualization.showInEditor).toBe(true);
    });
    
    it('validates tag filter query', () => {
      const query: TagFilterQuery = {
        includeTags: {
          year: '2023',
          topical_tags: [
            {
              domain: 'technology'
            }
          ]
        },
        excludeTags: {
          conversation_type: 'casual'
        },
        matchMode: 'all',
        confidenceThreshold: 0.7
      };
      
      expect(query.includeTags.year).toBe('2023');
      if (query.includeTags.topical_tags) {
        expect(query.includeTags.topical_tags[0].domain).toBe('technology');
      }
      expect(query.excludeTags.conversation_type).toBe('casual');
      expect(query.matchMode).toBe('all');
      expect(query.confidenceThreshold).toBe(0.7);
      
      // Verify enum values
      const validMatchModes: TagFilterQuery['matchMode'][] = ['any', 'all'];
      expect(validMatchModes).toContain(query.matchMode);
    });
    
    it('validates tagged file', () => {
      const taggedDate = new Date();
      
      const taggedFile: TaggedFile = {
        path: '/notes/conversation.md',
        name: 'conversation.md',
        tags: {
          year: '2023',
          topical_tags: [
            {
              domain: 'technology',
              subdomain: 'ai'
            }
          ],
          conversation_type: 'deep-dive',
          confidence: {
            overall: 0.92
          }
        },
        lastTagged: taggedDate,
        confidence: 0.92
      };
      
      expect(taggedFile.path).toBe('/notes/conversation.md');
      expect(taggedFile.name).toBe('conversation.md');
      expect(taggedFile.tags.year).toBe('2023');
      expect(taggedFile.tags.conversation_type).toBe('deep-dive');
      expect(taggedFile.lastTagged).toBe(taggedDate);
      expect(taggedFile.confidence).toBe(0.92);
    });
    
    it('validates tag suggestion', () => {
      const suggestion: TagSuggestion = {
        tag: {
          year: '2023',
          topical_tags: [
            {
              domain: 'technology',
              subdomain: 'ai'
            }
          ]
        },
        confidence: 0.85,
        explanation: 'This conversation discusses AI technology',
        source: 'ai'
      };
      
      expect(suggestion.tag.year).toBe('2023');
      if (suggestion.tag.topical_tags) {
        expect(suggestion.tag.topical_tags[0].domain).toBe('technology');
      }
      expect(suggestion.confidence).toBe(0.85);
      expect(suggestion.explanation).toBe('This conversation discusses AI technology');
      expect(suggestion.source).toBe('ai');
      
      // Verify enum values
      const validSources: TagSuggestion['source'][] = ['ai', 'similar-files', 'recent-usage'];
      expect(validSources).toContain(suggestion.source);
    });
    
    it('validates tag feedback', () => {
      const timestamp = new Date();
      
      const feedback: TagFeedback = {
        fileId: 'file-123',
        suggestedTags: {
          year: '2023',
          topical_tags: [
            {
              domain: 'technology',
              subdomain: 'ai'
            }
          ],
          conversation_type: 'deep-dive',
          confidence: {
            overall: 0.85
          }
        },
        acceptedTags: {
          year: '2023',
          topical_tags: [
            {
              domain: 'technology',
              subdomain: 'ai'
            }
          ],
          conversation_type: 'analysis',
          confidence: {
            overall: 0.85
          }
        },
        rejectedTags: {
          conversation_type: 'deep-dive'
        },
        modifiedTags: {
          conversation_type: 'analysis'
        },
        timestamp
      };
      
      expect(feedback.fileId).toBe('file-123');
      expect(feedback.suggestedTags.conversation_type).toBe('deep-dive');
      expect(feedback.acceptedTags.conversation_type).toBe('analysis');
      expect(feedback.rejectedTags.conversation_type).toBe('deep-dive');
      expect(feedback.modifiedTags.conversation_type).toBe('analysis');
      expect(feedback.timestamp).toBe(timestamp);
    });
    
    it('validates tag statistics', () => {
      const stats: TagStatistics = {
        totalTagged: 150,
        tagDistribution: {
          'technology': 45,
          'ai': 30,
          'software-development': 25
        },
        averageConfidence: 0.85,
        userModificationRate: 0.12,
        mostCommonTags: [
          { tag: 'technology', count: 45 },
          { tag: 'ai', count: 30 },
          { tag: 'software-development', count: 25 }
        ]
      };
      
      expect(stats.totalTagged).toBe(150);
      expect(stats.tagDistribution['technology']).toBe(45);
      expect(stats.averageConfidence).toBe(0.85);
      expect(stats.userModificationRate).toBe(0.12);
      expect(stats.mostCommonTags).toHaveLength(3);
      expect(stats.mostCommonTags[0].tag).toBe('technology');
      expect(stats.mostCommonTags[0].count).toBe(45);
    });
    
    it('validates tag event', () => {
      const timestamp = new Date();
      
      const event: TagEvent = {
        type: 'added',
        fileId: 'file-123',
        tags: {
          topical_tags: [
            {
              domain: 'technology',
              subdomain: 'ai'
            }
          ]
        },
        user: true,
        timestamp
      };
      
      expect(event.type).toBe('added');
      expect(event.fileId).toBe('file-123');
      if (event.tags.topical_tags) {
        expect(event.tags.topical_tags[0].domain).toBe('technology');
      }
      expect(event.user).toBe(true);
      expect(event.timestamp).toBe(timestamp);
      
      // Verify enum values
      const validEventTypes: TagEvent['type'][] = ['added', 'removed', 'updated', 'suggested'];
      expect(validEventTypes).toContain(event.type);
    });
  });
  
  describe('VS Code Extension Types', () => {
    it('validates VS Code settings', () => {
      const settings: VSCodeSettings = {
        api: {
          apiKey: 'test-api-key',
          apiKeyStorage: 'local',
          defaultModel: 'gpt-4o',
          timeoutMs: 30000,
          maxRetries: 3,
          costPerTokenMap: {
            'gpt-4o': 0.00005
          }
        },
        tagging: {
          model: 'gpt-4o',
          behavior: 'append',
          minConfidence: 0.6,
          reviewThreshold: 0.8,
          generateExplanations: true
        },
        ui: {
          showTagsInExplorer: true,
          enableTagHighlighting: true,
          tagDecorationStyle: 'background',
          showTagsInStatusBar: true
        },
        integration: {
          enableSidebarView: true,
          enableCodeLens: true,
          enableAutotagging: true,
          enableTagCompletion: true
        },
        workspace: {
          vaultPath: '/path/to/vault',
          scanOnStartup: true,
          excludePatterns: ['*.tmp', '*.log'],
          includePatterns: ['*.md']
        },
        advanced: {
          logLevel: 'info',
          enableTelemetry: true,
          cacheExpiration: 60
        }
      };
      
      // Type checking verification
      expect(settings.api.defaultModel).toBe('gpt-4o');
      expect(settings.tagging.behavior).toBe('append');
      expect(settings.ui.tagDecorationStyle).toBe('background');
      expect(settings.integration.enableSidebarView).toBe(true);
      expect(settings.workspace.vaultPath).toBe('/path/to/vault');
      expect(settings.advanced.logLevel).toBe('info');
      
      // Verify enum values
      const validDecorationStyles: VSCodeSettings['ui']['tagDecorationStyle'][] = 
        ['background', 'underline', 'outline'];
      expect(validDecorationStyles).toContain(settings.ui.tagDecorationStyle);
      
      const validLogLevels: VSCodeSettings['advanced']['logLevel'][] = 
        ['debug', 'info', 'warn', 'error'];
      expect(validLogLevels).toContain(settings.advanced.logLevel);
    });
    
    it('validates tag decoration', () => {
      const decoration: TagDecoration = {
        tag: 'technology',
        style: {
          backgroundColor: '#e6f7ff',
          color: '#0077cc',
          border: '1px solid #0077cc',
          borderRadius: '3px',
          fontWeight: 'bold'
        },
        hoverMessage: 'Technology tag (confidence: 0.92)'
      };
      
      expect(decoration.tag).toBe('technology');
      expect(decoration.style.backgroundColor).toBe('#e6f7ff');
      expect(decoration.style.color).toBe('#0077cc');
      expect(decoration.hoverMessage).toBe('Technology tag (confidence: 0.92)');
    });
    
    it('validates workspace document', () => {
      const modifiedDate = new Date(Date.now() - 3600000); // 1 hour ago
      const taggedDate = new Date();
      
      const document: WorkspaceDocument = {
        uri: 'file:///path/to/document.md',
        path: '/path/to/document.md',
        name: 'document.md',
        tags: {
          year: '2023',
          topical_tags: [
            {
              domain: 'technology',
              subdomain: 'ai'
            }
          ],
          conversation_type: 'deep-dive',
          confidence: {
            overall: 0.92
          }
        },
        lastModified: modifiedDate,
        lastTagged: taggedDate
      };
      
      expect(document.uri).toBe('file:///path/to/document.md');
      expect(document.path).toBe('/path/to/document.md');
      expect(document.name).toBe('document.md');
      expect(document.tags.year).toBe('2023');
      expect(document.lastModified).toBe(modifiedDate);
      expect(document.lastTagged).toBe(taggedDate);
    });
    
    it('validates tag tree node', () => {
      // Root node with children
      const rootNode: TagTreeNode = {
        id: 'root',
        label: 'Tags',
        type: 'tag-category',
        tooltip: 'All tags',
        children: [
          {
            id: 'domain-technology',
            label: 'Technology',
            type: 'tag',
            tooltip: 'Technology domain',
            parent: {} as TagTreeNode, // Parent reference to be set later
            children: [
              {
                id: 'doc-1',
                label: 'document.md',
                type: 'document',
                tooltip: 'Tagged with Technology',
                parent: {} as TagTreeNode, // Parent reference to be set later
                children: [],
                documentUri: 'file:///path/to/document.md',
                confidence: 0.92
              }
            ],
            tag: 'technology',
            confidence: 0.95,
            iconPath: '/path/to/tech-icon.svg'
          }
        ],
        iconPath: '/path/to/folder-icon.svg'
      };
      
      // Fix circular references
      (rootNode.children[0]!).parent = rootNode;
      (rootNode.children[0].children[0]!).parent = rootNode.children[0];
      
      expect(rootNode.id).toBe('root');
      expect(rootNode.type).toBe('tag-category');
      expect(rootNode.children).toHaveLength(1);
      expect(rootNode.children[0].label).toBe('Technology');
      expect(rootNode.children[0].type).toBe('tag');
      expect(rootNode.children[0].children[0].type).toBe('document');
      expect(rootNode.children[0].tag).toBe('technology');
      expect(rootNode.children[0].children[0].documentUri).toBe('file:///path/to/document.md');
      
      // Verify enum values
      const validNodeTypes: TagTreeNode['type'][] = ['tag-category', 'tag', 'document'];
      expect(validNodeTypes).toContain(rootNode.type);
      expect(validNodeTypes).toContain(rootNode.children[0].type);
    });
    
    it('validates tag view state', () => {
      const viewState: TagViewState = {
        documents: [
          {
            uri: 'file:///path/to/doc1.md',
            path: '/path/to/doc1.md',
            name: 'doc1.md',
            tags: {
              year: '2023',
              topical_tags: [{ domain: 'technology' }],
              conversation_type: 'deep-dive',
              confidence: { overall: 0.92 }
            },
            lastModified: new Date(),
            lastTagged: new Date()
          },
          {
            uri: 'file:///path/to/doc2.md',
            path: '/path/to/doc2.md',
            name: 'doc2.md',
            tags: {
              year: '2023',
              topical_tags: [{ domain: 'business' }],
              conversation_type: 'analysis',
              confidence: { overall: 0.88 }
            },
            lastModified: new Date(),
            lastTagged: new Date()
          }
        ],
        selectedDocument: {
          uri: 'file:///path/to/doc1.md',
          path: '/path/to/doc1.md',
          name: 'doc1.md',
          tags: {
            year: '2023',
            topical_tags: [{ domain: 'technology' }],
            conversation_type: 'deep-dive',
            confidence: { overall: 0.92 }
          },
          lastModified: new Date(),
          lastTagged: new Date()
        },
        selectedTags: ['technology', 'deep-dive'],
        expandedCategories: ['domains', 'conversation-types'],
        filterQuery: 'tech'
      };
      
      expect(viewState.documents).toHaveLength(2);
      expect(viewState.selectedDocument?.name).toBe('doc1.md');
      expect(viewState.selectedTags).toContain('technology');
      expect(viewState.expandedCategories).toContain('domains');
      expect(viewState.filterQuery).toBe('tech');
    });
    
    it('validates MCP context', () => {
      const context: MCPContext = {
        extensionPath: '/path/to/extension',
        workspacePath: '/path/to/workspace',
        serverPort: 9000,
        sessionId: 'session-123',
        capabilities: {
          tagging: true,
          modelAccess: true,
          fileAccess: true
        }
      };
      
      expect(context.extensionPath).toBe('/path/to/extension');
      expect(context.workspacePath).toBe('/path/to/workspace');
      expect(context.serverPort).toBe(9000);
      expect(context.sessionId).toBe('session-123');
      expect(context.capabilities.tagging).toBe(true);
      expect(context.capabilities.modelAccess).toBe(true);
      expect(context.capabilities.fileAccess).toBe(true);
    });
    
    it('validates cursor document', () => {
      const doc: CursorDocument = {
        uri: 'file:///path/to/doc.md',
        path: '/path/to/doc.md',
        tags: {
          year: '2023',
          topical_tags: [
            {
              domain: 'technology',
              subdomain: 'ai'
            }
          ],
          conversation_type: 'deep-dive',
          confidence: {
            overall: 0.92
          }
        },
        content: 'This is a document about AI technology',
        metadata: {
          createdAt: '2023-05-15',
          wordCount: 150
        }
      };
      
      expect(doc.uri).toBe('file:///path/to/doc.md');
      expect(doc.path).toBe('/path/to/doc.md');
      expect(doc.tags.year).toBe('2023');
      expect(doc.content).toBe('This is a document about AI technology');
      expect(doc.metadata).toHaveProperty('wordCount');
    });
    
    it('validates cursor command', () => {
      const mockExecute = vi.fn().mockResolvedValue({ success: true });
      
      const command: CursorCommand = {
        name: 'Tag Document',
        id: 'obsidian-magic.tagDocument',
        execute: mockExecute
      };
      
      expect(command.name).toBe('Tag Document');
      expect(command.id).toBe('obsidian-magic.tagDocument');
      
      // Test execution
      const context: MCPContext = {
        extensionPath: '/path/to/extension',
        workspacePath: '/path/to/workspace',
        serverPort: 9000,
        sessionId: 'session-123',
        capabilities: {
          tagging: true,
          modelAccess: true,
          fileAccess: true
        }
      };
      
      void command.execute(context, { documentUri: 'file:///path/to/doc.md' });
      expect(mockExecute).toHaveBeenCalledWith(context, { documentUri: 'file:///path/to/doc.md' });
    });
  });
}); 