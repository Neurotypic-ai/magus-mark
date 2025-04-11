#!/usr/bin/env node

/**
 * Bundle analysis script for Obsidian Magic plugin
 *
 * This script analyzes the plugin bundle size and composition
 * using source-map-explorer.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const MAIN_BUNDLE = path.resolve(__dirname, '../../dist/main.js');
const OUTPUT_HTML = path.resolve(__dirname, '../../bundle-analysis.html');
const OUTPUT_JSON = path.resolve(__dirname, '../../bundle-analysis.json');

// Check if bundle exists
if (!fs.existsSync(MAIN_BUNDLE)) {
  console.error(`❌ Bundle file not found: ${MAIN_BUNDLE}`);
  process.exit(1);
}

console.log('🔍 Analyzing bundle size and composition...');

try {
  // Run source-map-explorer for HTML output
  execSync(`npx source-map-explorer ${MAIN_BUNDLE} --html ${OUTPUT_HTML} --no-open`, {
    stdio: 'inherit',
  });

  // Run source-map-explorer for JSON output (for CI metrics)
  execSync(`npx source-map-explorer ${MAIN_BUNDLE} --json ${OUTPUT_JSON}`, {
    stdio: 'inherit',
  });

  // Read the JSON output to display summary stats
  const analysisData = JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf8'));

  // Calculate total bundle size
  const totalBytes = analysisData.totalBytes;
  const formattedSize = (totalBytes / 1024).toFixed(2) + ' KB';

  console.log(`\n✅ Bundle analysis complete!`);
  console.log(`📊 Total bundle size: ${formattedSize}`);
  console.log(`📝 Full report saved to: ${OUTPUT_HTML}`);

  // Report on largest dependencies (top 5)
  const bundles = analysisData.bundles || [];
  if (bundles.length > 0 && bundles[0].files) {
    const files = bundles[0].files;
    const sortedFiles = Object.entries(files)
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 5);

    console.log('\n📦 Largest dependencies:');
    sortedFiles.forEach(([name, data], index) => {
      const percentage = ((data.size / totalBytes) * 100).toFixed(2);
      const size = (data.size / 1024).toFixed(2);
      console.log(`   ${index + 1}. ${name}: ${size} KB (${percentage}%)`);
    });
  }

  // Check for bundle size thresholds
  if (totalBytes > 1024 * 1024) {
    // 1MB
    console.warn('\n⚠️ Warning: Bundle size exceeds 1MB. Consider optimization.');
  }
} catch (error) {
  console.error('❌ Error during bundle analysis:', error);
  process.exit(1);
}
