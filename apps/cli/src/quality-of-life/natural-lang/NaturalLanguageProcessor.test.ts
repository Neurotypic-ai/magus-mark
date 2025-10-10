import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NaturalLanguageProcessor } from './NaturalLanguageProcessor';

vi.mock('@magus-mark/core/utils/Logger', () => ({
  Logger: {
    getInstance: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

describe('NaturalLanguageProcessor', () => {
  let processor: NaturalLanguageProcessor;

  beforeEach(() => {
    processor = new NaturalLanguageProcessor();
  });

  it('recognizes tag_files intent', () => {
    const cmd = processor.processCommand('tag files');
    expect(cmd.intent).toBe('tag_files');
  });

  it('recognizes show_stats intent with period and type', () => {
    const cmd = processor.processCommand('show me cost stats for this week');
    expect(cmd.intent).toBe('show_stats');
    expect(cmd.entities.period).toBe('week');
    expect(cmd.entities.type).toBe('cost');
  });

  it('recognizes dashboard and test_models intents', () => {
    expect(processor.processCommand('launch dashboard').intent).toBe('dashboard');
    expect(processor.processCommand('benchmark models').intent).toBe('test_models');
  });

  it('returns unknown intent for unrecognized input', () => {
    const cmd = processor.processCommand('qwerty zxcv nonsense');
    expect(cmd.intent).toBe('unknown');
    expect(cmd.confidence).toBeLessThan(0.3);
  });

  it('executeCommand routes to handlers', () => {
    const tagCmd = processor.processCommand('tag files');
    const tagResp = processor.executeCommand(tagCmd);
    expect(tagResp.success).toBe(true);
    expect(tagResp.action).toBe('tag');

    const dashCmd = processor.processCommand('launch dashboard');
    const dashResp = processor.executeCommand(dashCmd);
    expect(dashResp.success).toBe(true);
    expect(dashResp.action).toBe('dashboard');

    const helpCmd = processor.processCommand('help me');
    const helpResp = processor.executeCommand(helpCmd);
    expect(helpResp.success).toBe(true);
    expect(helpResp.message).toContain('Natural Language Interface');
  });

  it('returns failure response for unknown intent', () => {
    const cmd = processor.processCommand('xyz abc 123');
    const resp = processor.executeCommand(cmd);
    expect(resp.success).toBe(false);
    expect(resp.message).toContain("don't understand");
  });
});
