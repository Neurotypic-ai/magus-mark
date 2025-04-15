import { mergeConfig } from 'vitest/config';

import baseConfig from './base.config.js';

export default mergeConfig(baseConfig, {
  test: {
    environment: 'jsdom',
    setupFiles: ['../../config/vitest/setup-react.js'],
  },
});
