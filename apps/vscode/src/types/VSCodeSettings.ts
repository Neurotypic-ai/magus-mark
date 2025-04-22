import type { APIConfig } from '@magus-mark/core/models/APIConfig';
import type { TaggingOptions } from '@magus-mark/core/models/TaggingOptions';

/**
 * VS Code extension settings
 */

export interface VSCodeSettings {
  api: APIConfig;
  tagging: TaggingOptions;
  ui: {
    showTagsInExplorer: boolean;
    enableTagHighlighting: boolean;
    tagDecorationStyle: 'background' | 'underline' | 'outline';
    showTagsInStatusBar: boolean;
  };
  integration: {
    enableSidebarView: boolean;
    enableCodeLens: boolean;
    enableAutotagging: boolean;
    enableTagCompletion: boolean;
  };
  workspace: {
    vaultPath: string;
    scanOnStartup: boolean;
    excludePatterns: string[];
    includePatterns: string[];
  };
  advanced: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableTelemetry: boolean;
    cacheExpiration: number; // in minutes
  };
}
