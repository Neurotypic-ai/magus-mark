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
  // Flag to identify if this is a dependency
  let isDependency = false;
  let packageName = '';

  // Special handling for pnpm dependencies
  if (source.includes('node_modules/.pnpm/')) {
    isDependency = true;
    // Extract package name from pnpm structure
    // Format is typically: node_modules/.pnpm/[package-name]@[version]/node_modules/[package-name]
    const pnpmMatch = source.match(/node_modules\/\.pnpm\/([^/]+)(@[^/]+)?\/node_modules\/([^/]+)/);
    if (pnpmMatch) {
      packageName = pnpmMatch[3]; // Return the actual package name
    } else {
      // Handle scoped packages in pnpm
      const pnpmScopedMatch = source.match(
        /node_modules\/\.pnpm\/(@[^/]+\/[^@]+)(@[^/]+)?\/node_modules\/(@[^/]+\/[^/]+)/
      );
      if (pnpmScopedMatch) {
        packageName = pnpmScopedMatch[3]; // Return the scoped package name
      } else {
        // Fallback for other pnpm patterns - extract meaningful part
        const simplePnpmMatch = source.match(/node_modules\/\.pnpm\/([^/]+)/);
        if (simplePnpmMatch) {
          packageName = simplePnpmMatch[1];
        } else {
          packageName = 'pnpm-dependency';
        }
      }
    }
  }
  // Standard node_modules handling
  else if (source.includes('node_modules')) {
    isDependency = true;
    // For node_modules, extract the package name with regex test once
    const match = source.match(/node_modules[\\/](@[^/\\]+[\\/][^/\\]+|[^/\\]+)/);
    packageName = match ? match[1] : 'dependency';
  }
  // For project files, create meaningful groupings based on project structure
  else {
    // Clean up source path
    const normalizedPath = source.replace(/^webpack:\/\/\//, '').replace(/^\.\//, '');

    // Skip parent directory references and get meaningful parts
    const parts = normalizedPath.split(/[/\\]/);

    // If it's in the packages or apps directory structure, use that grouping
    if (parts.includes('packages') || parts.includes('apps')) {
      const pkgIndex = parts.indexOf('packages');
      const appIndex = parts.indexOf('apps');
      const index = pkgIndex >= 0 ? pkgIndex : appIndex;

      if (index >= 0 && index + 1 < parts.length) {
        // Return "packages/[package-name]" or "apps/[app-name]"
        packageName = `${parts[index]}/${parts[index + 1]}`;
      }
    }
    // For src files, group by src/[module]
    else if (parts.includes('src')) {
      const srcIndex = parts.indexOf('src');
      if (srcIndex >= 0 && srcIndex + 1 < parts.length) {
        packageName = `src/${parts[srcIndex + 1]}`;
      }
    }
    // For files directly in the project root, use filename with extension
    else if (parts.length === 1) {
      packageName = parts[0];
    }
    // Avoid ".." as a grouping
    else if (parts[0] === '..') {
      // Try to find a meaningful part of the path
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] !== '..' && parts[i] !== '.') {
          // Return first meaningful directory name
          packageName = parts.slice(i).join('/');
          break;
        }
      }
    }
    // Default to first two meaningful parts of path if available
    else {
      packageName =
        parts
          .filter((p) => p !== '.' && p !== '..')
          .slice(0, 2)
          .join('/') || normalizedPath;
    }
  }

  return {
    name: packageName,
    isDependency,
  };
}

// Generate an HTML report with interactive features
function generateEnhancedHtmlReport(files, stats, componentType) {
  const template = readFileSync(TEMPLATE_PATH, 'utf8');
  const gzippedSize = gzipSync(readFileSync(MAIN_BUNDLE)).length;

  const html = render(template, {
    files,
    stats,
    componentType,
    gzippedSize,
  });

  writeFileSync(OUTPUT_HTML, html);
}

async function analyzeBundleSize() {
  try {
    // Read the bundle and source map files
    const bundleContent = readFileSync(MAIN_BUNDLE, 'utf8');
    const sourceMapContent = JSON.parse(readFileSync(MAIN_SOURCE_MAP, 'utf8'));

    // Initialize source map consumer once
    const consumer = await new SourceMapConsumer(sourceMapContent);

    // Create maps to store file sizes (using Objects for faster lookups)
    const projectFiles = {};
    const dependencyFiles = {};
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
    let totalDependencyBytes = 0;
    let totalProjectBytes = 0;

    for (const [source, size] of sourceSamples.entries()) {
      const { name, isDependency } = getPackageName(source);

      if (isDependency) {
        dependencyFiles[name] = (dependencyFiles[name] || 0) + size;
        totalDependencyBytes += size;
      } else {
        projectFiles[name] = (projectFiles[name] || 0) + size;
        totalProjectBytes += size;
      }
    }

    // Release the source map consumer
    consumer.destroy();

    // Convert to arrays and sort
    const sortedDependencies = Object.entries(dependencyFiles)
      .map(([name, size]) => ({
        name,
        size,
        percentage: ((size / totalBytes) * 100).toFixed(2),
        isDependency: true,
      }))
      .sort((a, b) => b.size - a.size);

    const sortedProjectFiles = Object.entries(projectFiles)
      .map(([name, size]) => ({
        name,
        size,
        percentage: ((size / totalBytes) * 100).toFixed(2),
        isDependency: false,
      }))
      .sort((a, b) => b.size - a.size);

    // Combine both lists for the full report
    const sortedFiles = [...sortedDependencies, ...sortedProjectFiles];

    // Calculate summary statistics
    const dependencyPercentage = ((totalDependencyBytes / totalBytes) * 100).toFixed(2);
    const projectPercentage = ((totalProjectBytes / totalBytes) * 100).toFixed(2);

    // Prepare analysis data
    const analysisData = {
      totalBytes,
      totalDependencyBytes,
      totalProjectBytes,
      dependencyPercentage,
      projectPercentage,
      bundles: [
        {
          name: basename(MAIN_BUNDLE),
          dependencies: sortedDependencies.reduce((acc, file) => {
            acc[file.name] = { size: file.size };
            return acc;
          }, {}),
          projectFiles: sortedProjectFiles.reduce((acc, file) => {
            acc[file.name] = { size: file.size };
            return acc;
          }, {}),
        },
      ],
    };

    // Save JSON report
    writeFileSync(OUTPUT_JSON, JSON.stringify(analysisData, null, 2));

    // Generate enhanced HTML report with interactive features
    generateEnhancedHtmlReport(
      sortedFiles,
      {
        totalBytes,
        totalDependencyBytes,
        totalProjectBytes,
        dependencyPercentage,
        projectPercentage,
        dependencyCount: sortedDependencies.length,
        projectFileCount: sortedProjectFiles.length,
      },
      componentType
    );

    // Display summary
    const formattedSize = (totalBytes / 1024).toFixed(2) + ' KB';
    const gzippedSize = (gzipSync(bundleContent).length / 1024).toFixed(2) + ' KB';
    const depSize = (totalDependencyBytes / 1024).toFixed(2) + ' KB';
    const projSize = (totalProjectBytes / 1024).toFixed(2) + ' KB';

    console.log(`\n✅ Bundle analysis complete!`);
    console.log(`📊 Total bundle size: ${formattedSize} (gzipped: ${gzippedSize})`);
    console.log(`   - Dependencies: ${depSize} (${dependencyPercentage}%)`);
    console.log(`   - Project files: ${projSize} (${projectPercentage}%)`);
    console.log(`📝 Full report saved to: ${OUTPUT_HTML}`);

    // Report on largest dependencies (top 5)
    console.log('\n📦 Largest dependencies:');
    sortedDependencies.slice(0, 5).forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name}: ${(file.size / 1024).toFixed(2)} KB (${file.percentage}%)`);
    });

    // Report on largest project files (top 5)
    console.log('\n📄 Largest project files:');
    sortedProjectFiles.slice(0, 5).forEach((file, index) => {
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
