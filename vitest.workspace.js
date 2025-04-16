import { defineWorkspace } from 'vitest/config';

export default defineWorkspace(['./packages/*/vitest.config.js', './apps/*/vitest.config.js']);
