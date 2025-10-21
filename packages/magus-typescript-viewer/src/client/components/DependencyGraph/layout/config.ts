import { graphTheme } from '../../../theme/graphTheme';

export interface LayoutConfig {
  // Core layout options
  direction?: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';
  nodeSpacing?: number;
  layerSpacing?: number;
  edgeSpacing?: number;
  algorithm?: 'layered' | 'force' | 'stress' | 'mrtree';

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
  direction: 'RIGHT', // Left-to-right (ELK: RIGHT) works better for hierarchical dependency graphs
  nodeSpacing: 150, // Increased for better node separation
  layerSpacing: 250, // Increased for clearer hierarchy (previously rankSpacing)
  edgeSpacing: 50,
  algorithm: 'layered', // ELK layered algorithm for hierarchical layouts
  margins: {
    top: 80,
    right: 80,
    bottom: 80,
    left: 80,
  },
  animationDuration: 150,
  theme: graphTheme,
};

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
