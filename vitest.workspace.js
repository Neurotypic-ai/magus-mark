import { defineWorkspace } from 'vitest/config';

export default defineWorkspace(['./packages/*/vitest.config.(js|ts)', './apps/*/vitest.config.(js|ts)']);
