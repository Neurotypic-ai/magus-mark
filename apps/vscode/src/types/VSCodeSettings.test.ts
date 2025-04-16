import { describe, expect, it } from 'vitest';

import type { VSCodeSettings } from './VSCodeSettings';

describe('VSCodeSettings', () => {
  it('validates VS Code settings', () => {
    const settings: VSCodeSettings = {
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
        showTagsInExplorer: true,
        enableTagHighlighting: true,
        tagDecorationStyle: 'background',
        showTagsInStatusBar: true,
      },
      integration: {
        enableSidebarView: true,
        enableCodeLens: true,
        enableAutotagging: true,
        enableTagCompletion: true,
      },
      workspace: {
        vaultPath: '/path/to/vault',
        scanOnStartup: true,
        excludePatterns: ['*.tmp', '*.log'],
        includePatterns: ['*.md'],
      },
      advanced: {
        logLevel: 'info',
        enableTelemetry: true,
        cacheExpiration: 60,
      },
    };

    // Type checking verification
    expect(settings.api.defaultModel).toBe('gpt-4o');
    expect(settings.tagging.behavior).toBe('append');
    expect(settings.ui.tagDecorationStyle).toBe('background');
    expect(settings.integration.enableSidebarView).toBe(true);
    expect(settings.workspace.vaultPath).toBe('/path/to/vault');
    expect(settings.advanced.logLevel).toBe('info');

    // Verify enum values
    const validDecorationStyles: VSCodeSettings['ui']['tagDecorationStyle'][] = ['background', 'underline', 'outline'];
    expect(validDecorationStyles).toContain(settings.ui.tagDecorationStyle);

    const validLogLevels: VSCodeSettings['advanced']['logLevel'][] = ['debug', 'info', 'warn', 'error'];
    expect(validLogLevels).toContain(settings.advanced.logLevel);
  });
});
