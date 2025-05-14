#!/usr/bin/env node

/**
 * Bundle analysis script for Magus Mark components
 *
 * This script analyzes bundle size and composition
 * using the source-map package from Mozilla.
 *
 * Usage: node analyze-bundle.js <component-type> <bundle-path> <output-path>
 *
 * Example: node analyze-bundle.js obsidian-plugin ../apps/obsidian-plugin/dist/main.js ../apps/obsidian-plugin/bundle-analysis.html
 * Example: node analyze-bundle.js vscode ../apps/vscode/dist/extension.js ../apps/vscode/bundle-analysis.html
 */
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { basename, dirname, resolve } from 'path';
import { gzipSync } from 'zlib';

import { render } from 'ejs';
import { SourceMapConsumer } from 'source-map';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const componentType = process.argv[2] || 'unknown';
const bundlePath = process.argv[3] || '';
const outputPath = process.argv[4] || '';

if (!bundlePath) {
  console.error('❌ Error: Bundle path is required');
  console.log('Usage: node analyze-bundle.js <component-type> <bundle-path> <output-path>');
  process.exit(1);
}

if (!outputPath) {
  console.error('❌ Error: Output path is required');
  console.log('Usage: node analyze-bundle.js <component-type> <bundle-path> <output-path>');
  process.exit(1);
}

// Configuration
const MAIN_BUNDLE = resolve(process.cwd(), bundlePath);
const MAIN_SOURCE_MAP = `${MAIN_BUNDLE}.map`;
const OUTPUT_HTML = resolve(process.cwd(), outputPath);
const OUTPUT_JSON = resolve(process.cwd(), dirname(outputPath), 'bundle-analysis.json');
const TEMPLATE_PATH = resolve(__dirname, './bundle-analysis-template.ejs');

// Check if bundle exists
if (!existsSync(MAIN_BUNDLE)) {
  console.error(`❌ Bundle file not found: ${MAIN_BUNDLE}`);
  process.exit(1);
}

// Check if source map exists
if (!existsSync(MAIN_SOURCE_MAP)) {
  console.error(`❌ Source map file not found: ${MAIN_SOURCE_MAP}`);
  process.exit(1);
}

console.log(`🔍 Analyzing ${componentType} bundle size and composition...`);

// Helper function to get package name from source
function getPackageName(source) {
  if (source.includes('node_modules')) {
    // For node_modules, extract the package name with regex test once
    const match = source.match(/node_modules[\\/](@[^/\\]+[\\/][^/\\]+|[^/\\]+)/);
    return match ? match[1] : source;
  } else {
    // For project files, use the relative path
    return source;
  }
}

// Generate a simple HTML report
function generateSimpleHtmlReport(files, totalBytes, componentType) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${componentType} Bundle Analysis Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        .header { margin-bottom: 20px; }
        .file-list { width: 100%; border-collapse: collapse; }
        .file-list th, .file-list td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        .file-list th { background-color: #f2f2f2; }
        .bar { background-color: #4CAF50; height: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${componentType} Bundle Analysis Report</h1>
          <p>Total Size: ${(totalBytes / 1024).toFixed(2)} KB</p>
        </div>
        <table class="file-list">
          <thead>
            <tr>
              <th>File</th>
              <th>Size (KB)</th>
              <th>Percentage</th>
              <th>Visualization</th>
            </tr>
          </thead>
          <tbody>
            ${files
              .map(
                (file) => `
              <tr>
                <td>${file.name}</td>
                <td>${(file.size / 1024).toFixed(2)}</td>
                <td>${file.percentage}%</td>
                <td><div class="bar" style="width: ${file.percentage}%"></div></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;

  writeFileSync(OUTPUT_HTML, html);
}

async function analyzeBundleSize() {
  try {
    // Read the bundle and source map files
    const bundleContent = readFileSync(MAIN_BUNDLE, 'utf8');
    const sourceMapContent = JSON.parse(readFileSync(MAIN_SOURCE_MAP, 'utf8'));

    // Initialize source map consumer once
    const consumer = await new SourceMapConsumer(sourceMapContent);

    // Create a map to store file sizes (using Object for faster lookups)
    const fileSizes = {};
    const totalBytes = bundleContent.length;

    // Pre-compute line and column information for the entire bundle
    // This is much faster than computing it for each character
    const lines = bundleContent.split('\n');
    const lineStarts = [0];
    let position = 0;

    for (const line of lines) {
      position += line.length + 1; // +1 for the newline character
      lineStarts.push(position);
    }

    // Sample the bundle at regular intervals instead of every character
    // This dramatically speeds up analysis while maintaining decent accuracy
    const SAMPLE_RATE = Math.max(1, Math.floor(totalBytes / 10000)); // Sample ~10K points
    const sourceSamples = new Map();

    for (let i = 0; i < totalBytes; i += SAMPLE_RATE) {
      // Fast line/column calculation
      const lineIndex = findLineIndex(lineStarts, i);
      const line = lineIndex + 1;
      const column = i - lineStarts[lineIndex];

      const pos = consumer.originalPositionFor({ line, column });

      if (pos.source) {
        // Normalize the source path
        const source = pos.source.replace(/^webpack:\/\/\//, '');

        // Skip if the source is the bundle itself or null
        if (!source || source === basename(MAIN_BUNDLE)) continue;

        // Weight each sample by the sample rate
        const weight = Math.min(SAMPLE_RATE, totalBytes - i);

        // Track source occurrences
        if (sourceSamples.has(source)) {
          sourceSamples.set(source, sourceSamples.get(source) + weight);
        } else {
          sourceSamples.set(source, weight);
        }
      }
    }

    // Group by package
    for (const [source, size] of sourceSamples.entries()) {
      const packageName = getPackageName(source);
      fileSizes[packageName] = (fileSizes[packageName] || 0) + size;
    }

    // Release the source map consumer
    consumer.destroy();

    // Convert to array and sort
    const sortedFiles = Object.entries(fileSizes)
      .map(([name, size]) => ({
        name,
        size,
        percentage: ((size / totalBytes) * 100).toFixed(2),
      }))
      .sort((a, b) => b.size - a.size);

    // Prepare analysis data
    const analysisData = {
      totalBytes,
      bundles: [
        {
          name: basename(MAIN_BUNDLE),
          files: sortedFiles.reduce((acc, file) => {
            acc[file.name] = { size: file.size };
            return acc;
          }, {}),
        },
      ],
    };

    // Save JSON report
    writeFileSync(OUTPUT_JSON, JSON.stringify(analysisData, null, 2));

    // Generate HTML report if template exists
    if (existsSync(TEMPLATE_PATH)) {
      const template = readFileSync(TEMPLATE_PATH, 'utf8');
      const html = render(template, {
        data: {
          componentType,
          totalSize: (totalBytes / 1024).toFixed(2) + ' KB',
          files: sortedFiles,
        },
      });
      writeFileSync(OUTPUT_HTML, html);
    } else {
      // Generate a simple HTML report if template doesn't exist
      generateSimpleHtmlReport(sortedFiles, totalBytes, componentType);
    }

    // Display summary
    const formattedSize = (totalBytes / 1024).toFixed(2) + ' KB';
    const gzippedSize = (gzipSync(bundleContent).length / 1024).toFixed(2) + ' KB';

    console.log(`\n✅ Bundle analysis complete!`);
    console.log(`📊 Total bundle size: ${formattedSize} (gzipped: ${gzippedSize})`);
    console.log(`📝 Full report saved to: ${OUTPUT_HTML}`);

    // Report on largest dependencies (top 5)
    console.log('\n📦 Largest dependencies:');
    sortedFiles.slice(0, 5).forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name}: ${(file.size / 1024).toFixed(2)} KB (${file.percentage}%)`);
    });

    // Check for bundle size thresholds
    if (totalBytes > 1024 * 1024) {
      // 1MB
      console.warn('\n⚠️ Warning: Bundle size exceeds 1MB. Consider optimization.');
    }
  } catch (error) {
    console.error('❌ Error during bundle analysis:', error);
    process.exit(1);
  }
}

// Fast binary search to find line index given position
function findLineIndex(lineStarts, position) {
  let left = 0;
  let right = lineStarts.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (lineStarts[mid] <= position && (mid === lineStarts.length - 1 || lineStarts[mid + 1] > position)) {
      return mid;
    }

    if (lineStarts[mid] <= position) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return 0; // Fallback
}

// Run the analysis
analyzeBundleSize();
