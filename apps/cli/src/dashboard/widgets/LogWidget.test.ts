import { describe, expect, it, vi } from 'vitest';

import { LogWidget } from './LogWidget';

import type { WidgetConfig } from '../DashboardManager';

const mockLogWidget = {
  log: vi.fn(),
  setContent: vi.fn(),
};

const mockGrid = {
  set: vi.fn(() => mockLogWidget),
};

vi.mock('blessed-contrib', () => ({
  default: {
    log: Symbol('log'),
  },
}));

describe('LogWidget', () => {
  it('formats log messages with timestamp and level colors', () => {
    const config: WidgetConfig = {
      id: 'test-log',
      type: 'log',
      position: { x: 0, y: 0, width: 8, height: 4 },
      title: 'Test Log',
      dataSource: 'system:log',
    };

    const widget = new LogWidget(config, mockGrid as never);

    widget.update({ message: 'ERROR: something broke' });
    expect(mockLogWidget.log).toHaveBeenCalled();
    const logged = mockLogWidget.log.mock.calls[0]?.[0] as string;
    expect(logged).toContain('ERROR: something broke');
    expect(logged).toMatch(/\{red-fg\}/);
  });

  it('clears log widget', () => {
    const config: WidgetConfig = {
      id: 'test-log',
      type: 'log',
      position: { x: 0, y: 0, width: 8, height: 4 },
      title: 'Test Log',
      dataSource: 'system:log',
    };

    const widget = new LogWidget(config, mockGrid as never);
    widget.clear();
    expect(mockLogWidget.setContent).toHaveBeenCalledWith('');
  });
});
