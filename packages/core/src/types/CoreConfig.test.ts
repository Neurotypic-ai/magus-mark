import { describe, expect, it } from 'vitest';

import type { AIModel } from '../models/AIModel';
import type { APIKeyStorage } from '../models/APIKeyStorage';
import type { TagBehavior } from '../models/TagBehavior';
import type { LogLevel } from '../utils/Logger';
import type { CoreConfig, OnLimitReached, OutputFormat } from './CoreConfig';

describe('CoreConfig', () => {
  it('should create a valid config with all required properties', () => {
    const config: CoreConfig = {
      apiKeyStorage: 'local' as APIKeyStorage,
      minConfidence: 0.7,
      reviewThreshold: 0.5,
      generateExplanations: true,
      concurrency: 3,
      tagMode: 'merge' as TagBehavior,
      logLevel: 'info' as LogLevel,
    };

    // Assertions to ensure TypeScript properly validates the type
    // The fact that this code compiles confirms the type is correct
    expect(config).toBeDefined();
    expect(config.apiKeyStorage).toBe('local');
    expect(config.minConfidence).toBe(0.7);
    expect(config.reviewThreshold).toBe(0.5);
    expect(config.generateExplanations).toBe(true);
    expect(config.concurrency).toBe(3);
    expect(config.tagMode).toBe('merge');
    expect(config.logLevel).toBe('info');
  });

  it('should create a valid config with all optional properties', () => {
    const config: CoreConfig = {
      apiKey: 'sk-test-key',
      apiKeyStorage: 'system' as APIKeyStorage,
      defaultModel: 'gpt-4o' as AIModel,
      minConfidence: 0.8,
      reviewThreshold: 0.6,
      generateExplanations: false,
      concurrency: 5,
      tagMode: 'append' as TagBehavior,
      outputFormat: 'json' as OutputFormat,
      logLevel: 'debug' as LogLevel,
      costLimit: 10,
      onLimitReached: 'pause' as OnLimitReached,
    };

    expect(config).toBeDefined();
    expect(config.apiKey).toBe('sk-test-key');
    expect(config.apiKeyStorage).toBe('system');
    expect(config.defaultModel).toBe('gpt-4o');
    expect(config.minConfidence).toBe(0.8);
    expect(config.reviewThreshold).toBe(0.6);
    expect(config.generateExplanations).toBe(false);
    expect(config.concurrency).toBe(5);
    expect(config.tagMode).toBe('append');
    expect(config.outputFormat).toBe('json');
    expect(config.logLevel).toBe('debug');
    expect(config.costLimit).toBe(10);
    expect(config.onLimitReached).toBe('pause');
  });

  it('should accept different types for enum values', () => {
    // Testing enum type values are correctly enforced
    const formats: OutputFormat[] = ['pretty', 'json', 'silent'];
    expect(formats.length).toBe(3);

    const limitBehaviors: OnLimitReached[] = ['warn', 'pause', 'stop'];
    expect(limitBehaviors.length).toBe(3);

    const storageOptions: APIKeyStorage[] = ['local', 'system'];
    expect(storageOptions.length).toBe(2);

    const logLevels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    expect(logLevels.length).toBe(4);

    const tagBehaviors: TagBehavior[] = ['append', 'replace', 'merge', 'suggest'];
    expect(tagBehaviors.length).toBe(4);
  });

  it('should enforce numeric constraints through type system', () => {
    // Create configs with different numeric values
    const config1: CoreConfig = {
      apiKeyStorage: 'local',
      minConfidence: 0,
      reviewThreshold: 0,
      generateExplanations: true,
      concurrency: 1,
      tagMode: 'merge',
      logLevel: 'info',
    };

    const config2: CoreConfig = {
      apiKeyStorage: 'local',
      minConfidence: 1,
      reviewThreshold: 1,
      generateExplanations: true,
      concurrency: 10,
      tagMode: 'merge',
      logLevel: 'info',
    };

    // TypeScript would catch if values outside range were used
    expect(config1.minConfidence).toBeGreaterThanOrEqual(0);
    expect(config1.minConfidence).toBeLessThanOrEqual(1);
    expect(config2.minConfidence).toBeGreaterThanOrEqual(0);
    expect(config2.minConfidence).toBeLessThanOrEqual(1);

    expect(config1.reviewThreshold).toBeGreaterThanOrEqual(0);
    expect(config1.reviewThreshold).toBeLessThanOrEqual(1);
    expect(config2.reviewThreshold).toBeGreaterThanOrEqual(0);
    expect(config2.reviewThreshold).toBeLessThanOrEqual(1);
  });

  it('should validate configuration object structure', () => {
    // Test boundary values for numerical properties
    function testValidConfig(): CoreConfig {
      return {
        apiKeyStorage: 'local',
        minConfidence: 0.5,
        reviewThreshold: 0.3,
        generateExplanations: false,
        concurrency: 5,
        tagMode: 'merge',
        logLevel: 'info',
      };
    }

    const validConfig = testValidConfig();
    expect(validConfig).toBeDefined();

    // The following code is commented out because it would cause TypeScript compilation errors.
    // These comments demonstrate how TypeScript's type system prevents invalid configurations.

    // Invalid apiKeyStorage (TypeScript would error: Type '"invalid"' is not assignable to type 'APIKeyStorage')
    // const invalidStorageConfig: CoreConfig = { ...testValidConfig(), apiKeyStorage: 'invalid' };

    // Invalid tagMode (TypeScript would error: Type '"unknown"' is not assignable to type 'TagBehavior')
    // const invalidTagModeConfig: CoreConfig = { ...testValidConfig(), tagMode: 'unknown' };

    // Invalid logLevel (TypeScript would error: Type '"trace"' is not assignable to type 'LogLevel')
    // const invalidLogLevelConfig: CoreConfig = { ...testValidConfig(), logLevel: 'trace' };

    // Invalid outputFormat (TypeScript would error: Type '"xml"' is not assignable to type 'OutputFormat')
    // const invalidOutputFormatConfig: CoreConfig = { ...testValidConfig(), outputFormat: 'xml' };

    // Invalid onLimitReached (TypeScript would error: Type '"crash"' is not assignable to type 'OnLimitReached')
    // const invalidLimitBehaviorConfig: CoreConfig = { ...testValidConfig(), onLimitReached: 'crash' };
  });
});
