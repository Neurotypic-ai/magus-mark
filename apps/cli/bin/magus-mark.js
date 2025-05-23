#!/usr/bin/env node

import('../dist/cli.js').catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
