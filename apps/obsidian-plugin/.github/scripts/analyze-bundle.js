#!/usr/bin/env node

/**
 * Bundle analysis script for Obsidian Magic plugin
 *
 * This script analyzes the plugin bundle size and composition
 * using the source-map package from Mozilla instead of the outdated source-map-explorer.
 */

const fs = require('fs');
const path = require('path');
const sourceMap = require('source-map');
const zlib = require('zlib');
const ejs = require('ejs');

// Configuration
const MAIN_BUNDLE = path.resolve(__dirname, '../../dist/main.js');
const MAIN_SOURCE_MAP = path.resolve(__dirname, '../../dist/main.js.map');
const OUTPUT_HTML = path.resolve(__dirname, '../../bundle-analysis.html');
const OUTPUT_JSON = path.resolve(__dirname, '../../bundle-analysis.json');
const TEMPLATE_PATH = path.resolve(__dirname, './bundle-analysis-template.ejs');

// Check if bundle exists
if (!fs.existsSync(MAIN_BUNDLE)) {
  console.error(`❌ Bundle file not found: ${MAIN_BUNDLE}`);
  process.exit(1);
}

// Check if source map exists
if (!fs.existsSync(MAIN_SOURCE_MAP)) {
  console.error(`❌ Source map file not found: ${MAIN_SOURCE_MAP}`);
  process.exit(1);
}

console.log('🔍 Analyzing bundle size and composition...');

async function analyzeBundleSize() {
  try {
    // Read the bundle and source map files
    const bundleContent = fs.readFileSync(MAIN_BUNDLE, 'utf8');
    const sourceMapContent = JSON.parse(fs.readFileSync(MAIN_SOURCE_MAP, 'utf8'));

    // Parse the source map
    const consumer = await new sourceMap.SourceMapConsumer(sourceMapContent);

    // Create a map to store file sizes
    const fileSizes = new Map();
    const totalBytes = bundleContent.length;

    // Analyze each position in the bundle
    for (let i = 0; i < bundleContent.length; i++) {
      const pos = consumer.originalPositionFor({
        line: getLineAndColumn(bundleContent, i).line,
        column: getLineAndColumn(bundleContent, i).column,
      });

      if (pos.source) {
        // Normalize the source path
        const source = pos.source.replace(/^webpack:\/\/\//, '');

        // Skip if the source is the bundle itself or null
        if (!source || source === 'main.js') continue;

        // Group by package or file
        const packageName = getPackageName(source);

        if (!fileSizes.has(packageName)) {
          fileSizes.set(packageName, 0);
        }

        fileSizes.set(packageName, fileSizes.get(packageName) + 1);
      }
    }

    // Release the source map consumer
    consumer.destroy();

    // Sort files by size
    const sortedFiles = Array.from(fileSizes.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, size]) => ({
        name,
        size,
        percentage: ((size / totalBytes) * 100).toFixed(2),
      }));

    // Prepare analysis data
    const analysisData = {
      totalBytes,
      bundles: [
        {
          name: 'main.js',
          files: sortedFiles.reduce((acc, file) => {
            acc[file.name] = { size: file.size };
            return acc;
          }, {}),
        },
      ],
    };

    // Save JSON report
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(analysisData, null, 2));

    // Generate HTML report if template exists
    if (fs.existsSync(TEMPLATE_PATH)) {
      const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
      const html = ejs.render(template, {
        data: {
          totalSize: (totalBytes / 1024).toFixed(2) + ' KB',
          files: sortedFiles,
        },
      });
      fs.writeFileSync(OUTPUT_HTML, html);
    } else {
      // Generate a simple HTML report if template doesn't exist
      generateSimpleHtmlReport(sortedFiles, totalBytes);
    }

    // Display summary
    const formattedSize = (totalBytes / 1024).toFixed(2) + ' KB';
    const gzippedSize = (zlib.gzipSync(bundleContent).length / 1024).toFixed(2) + ' KB';

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

// Helper function to get line and column from position
function getLineAndColumn(content, position) {
  const lines = content.slice(0, position).split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length;
  return { line, column };
}

// Helper function to get package name from source
function getPackageName(source) {
  if (source.includes('node_modules')) {
    // For node_modules, extract the package name
    const match = source.match(/node_modules[\\/](@[^/\\]+[\\/][^/\\]+|[^/\\]+)/);
    return match ? match[1] : source;
  } else {
    // For project files, use the relative path
    return source;
  }
}

// Generate a simple HTML report
function generateSimpleHtmlReport(files, totalBytes) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bundle Analysis Report</title>
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
          <h1>Bundle Analysis Report</h1>
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

  fs.writeFileSync(OUTPUT_HTML, html);
}

// Run the analysis
analyzeBundleSize();
