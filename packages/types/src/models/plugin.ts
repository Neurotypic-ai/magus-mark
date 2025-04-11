/**
 * Plugin-specific type definitions for Obsidian Magic
 */

import type { TagSet } from './tags';
import type { APIConfig, TaggingOptions } from './api';

/**
 * Obsidian plugin settings
 */
export interface PluginSettings {
  api: APIConfig;
  tagging: TaggingOptions;
  ui: {
    showTagsInFileExplorer: boolean;
    enableTagHighlighting: boolean;
    enableTagSuggestions: boolean;
    showConfidenceScores: boolean;
    tagDisplayStyle: 'chips' | 'text' | 'both';
  };
  sync: {
    enableAutoTagging: boolean;
    tagOnSave: boolean;
    tagOnOpen: boolean;
    syncInterval: number; // in minutes, 0 = disabled
  };
  advanced: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableMetrics: boolean;
    useLocalProcessing: boolean;
    batchSize: number;
    maxConcurrency: number;
  };
}

/**
 * Tag visualization properties
 */
export interface TagVisualization {
  color: string;
  icon: string;
  priority: number;
  showInBrowser: boolean;
  showInEditor: boolean;
}

/**
 * Tag filter query for searching and filtering
 */
export interface TagFilterQuery {
  includeTags: Partial<TagSet>;
  excludeTags: Partial<TagSet>;
  matchMode: 'any' | 'all';
  confidenceThreshold?: number;
}

/**
 * File with associated tag metadata
 */
export interface TaggedFile {
  path: string;
  name: string;
  tags: TagSet;
  lastTagged: Date;
  confidence: number;
}

/**
 * Tag suggestion with confidence and explanation
 */
export interface TagSuggestion {
  tag: Partial<TagSet>;
  confidence: number;
  explanation: string;
  source: 'ai' | 'similar-files' | 'recent-usage';
}

/**
 * User feedback for tag suggestions
 */
export interface TagFeedback {
  fileId: string;
  suggestedTags: TagSet;
  acceptedTags: TagSet;
  rejectedTags: Partial<TagSet>;
  modifiedTags: Partial<TagSet>;
  timestamp: Date;
}

/**
 * Tag statistics for analytics
 */
export interface TagStatistics {
  totalTagged: number;
  tagDistribution: Record<string, number>;
  averageConfidence: number;
  userModificationRate: number;
  mostCommonTags: {tag: string; count: number}[];
}

/**
 * Tag event for tracking and event handling
 */
export interface TagEvent {
  type: 'added' | 'removed' | 'updated' | 'suggested';
  fileId: string;
  tags: Partial<TagSet>;
  user: boolean; // true if user initiated, false if system
  timestamp: Date;
} 