import { describe, expect, it } from 'vitest';

import type {
  PluginSettings,
  TagEvent,
  TagFeedback,
  TagFilterQuery,
  TagStatistics,
  TagSuggestion,
  TagVisualization,
  TaggedFile,
} from './plugin';

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
          'gpt-4o': 0.00005,
        },
      },
      tagging: {
        model: 'gpt-4o',
        behavior: 'append',
        minConfidence: 0.6,
        reviewThreshold: 0.8,
        generateExplanations: true,
      },
      ui: {
        showTagsInFileExplorer: true,
        enableTagHighlighting: true,
        enableTagSuggestions: true,
        showConfidenceScores: false,
        tagDisplayStyle: 'chips',
      },
      sync: {
        enableAutoTagging: true,
        tagOnSave: true,
        tagOnOpen: false,
        syncInterval: 60,
      },
      advanced: {
        logLevel: 'info',
        enableMetrics: true,
        useLocalProcessing: false,
        batchSize: 10,
        maxConcurrency: 4,
      },
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
      showInEditor: true,
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
            domain: 'technology',
          },
        ],
      },
      excludeTags: {
        conversation_type: 'casual',
      },
      matchMode: 'all',
      confidenceThreshold: 0.7,
    };

    expect(query.includeTags.year).toBe('2023');
    if (query.includeTags.topical_tags && query.includeTags.topical_tags.length > 0) {
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
            subdomain: 'ai',
          },
        ],
        conversation_type: 'deep-dive',
        confidence: {
          overall: 0.92,
        },
      },
      lastTagged: taggedDate,
      confidence: 0.92,
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
            subdomain: 'ai',
          },
        ],
      },
      confidence: 0.85,
      explanation: 'This conversation discusses AI technology',
      source: 'ai',
    };

    expect(suggestion.tag.year).toBe('2023');
    if (suggestion.tag.topical_tags && suggestion.tag.topical_tags.length > 0) {
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
            subdomain: 'ai',
          },
        ],
        conversation_type: 'deep-dive',
        confidence: {
          overall: 0.85,
        },
      },
      acceptedTags: {
        year: '2023',
        topical_tags: [
          {
            domain: 'technology',
            subdomain: 'ai',
          },
        ],
        conversation_type: 'analysis',
        confidence: {
          overall: 0.85,
        },
      },
      rejectedTags: {
        conversation_type: 'deep-dive',
      },
      modifiedTags: {
        conversation_type: 'analysis',
      },
      timestamp,
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
        technology: 45,
        ai: 30,
        'software-development': 25,
      },
      averageConfidence: 0.85,
      userModificationRate: 0.12,
      mostCommonTags: [
        { tag: 'technology', count: 45 },
        { tag: 'ai', count: 30 },
        { tag: 'software-development', count: 25 },
      ],
    };

    expect(stats.totalTagged).toBe(150);
    expect(stats.tagDistribution['technology']).toBe(45);
    expect(stats.averageConfidence).toBe(0.85);
    expect(stats.userModificationRate).toBe(0.12);
    expect(stats.mostCommonTags).toHaveLength(3);
    if (stats.mostCommonTags && stats.mostCommonTags.length > 0) {
      expect(stats.mostCommonTags[0].tag).toBe('technology');
      expect(stats.mostCommonTags[0].count).toBe(45);
    }
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
            subdomain: 'ai',
          },
        ],
      },
      user: true,
      timestamp,
    };

    expect(event.type).toBe('added');
    expect(event.fileId).toBe('file-123');
    if (event.tags.topical_tags && event.tags.topical_tags.length > 0) {
      expect(event.tags.topical_tags[0].domain).toBe('technology');
    }
    expect(event.user).toBe(true);
    expect(event.timestamp).toBe(timestamp);

    // Verify enum values
    const validEventTypes: TagEvent['type'][] = ['added', 'removed', 'updated', 'suggested'];
    expect(validEventTypes).toContain(event.type);
  });
});
