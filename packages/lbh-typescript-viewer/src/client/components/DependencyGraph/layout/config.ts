import { graphTheme } from '../../../theme/graphTheme';

export interface LayoutConfig {
  // Core layout options
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
  nodeSpacing?: number;
  rankSpacing?: number;
  edgeSpacing?: number;

  // Margins and padding
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  // Animation settings
  animationDuration?: number;

  // Theme integration
  theme?: typeof graphTheme;
}

export const defaultLayoutConfig: LayoutConfig = {
  direction: 'TB',
  nodeSpacing: 50,
  rankSpacing: 100,
  edgeSpacing: 30,
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  animationDuration: 300,
  theme: graphTheme,
};

// Layout-specific configurations
export interface HierarchicalLayoutConfig extends LayoutConfig {
  alignSiblings?: boolean;
  depthSeparation?: number;
}

export interface ForceLayoutConfig extends LayoutConfig {
  iterations?: number;
  strength?: number;
  distance?: number;
}

// Utility to merge configs with defaults
export function mergeConfig<T extends LayoutConfig>(config: Partial<T>, defaults: T): T {
  return {
    ...defaults,
    ...config,
    margins: {
      ...defaults.margins,
      ...(config.margins ?? {}),
    },
  };
}
