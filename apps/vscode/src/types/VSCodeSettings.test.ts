import { expect } from 'chai';

import type { VSCodeSettings } from './VSCodeSettings';

suite('VSCodeSettings', () => {
  test('validates VS Code settings', () => {
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
    expect(settings.api.defaultModel).to.equal('gpt-4o');
    expect(settings.tagging.behavior).to.equal('append');
    expect(settings.ui.tagDecorationStyle).to.equal('background');
    expect(settings.integration.enableSidebarView).to.equal(true);
    expect(settings.workspace.vaultPath).to.equal('/path/to/vault');
    expect(settings.advanced.logLevel).to.equal('info');

    // Verify enum values
    const validDecorationStyles: VSCodeSettings['ui']['tagDecorationStyle'][] = ['background', 'underline', 'outline'];
    expect(validDecorationStyles).to.include(settings.ui.tagDecorationStyle);

    const validLogLevels: VSCodeSettings['advanced']['logLevel'][] = ['debug', 'info', 'warn', 'error'];
    expect(validLogLevels).to.include(settings.advanced.logLevel);
  });
});
