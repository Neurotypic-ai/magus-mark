#!/usr/bin/env node

/**
 * Dependency checking script for Obsidian Magic plugin
 *
 * This script analyzes the plugin dependencies for:
 * - Security vulnerabilities
 * - Outdated packages
 * - Peer dependency satisfaction
 * - Duplicate dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking plugin dependencies...');

// Configuration
const PLUGIN_DIR = path.resolve(__dirname, '../../');
const PACKAGE_JSON = path.join(PLUGIN_DIR, 'package.json');
const REPORT_FILE = path.join(PLUGIN_DIR, 'dependency-report.md');

// Parse package.json
try {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));

  // Start report
  let report = '# Dependency Health Report\n\n';
  report += `Generated on: ${new Date().toISOString()}\n\n`;

  // Check peer dependencies for Obsidian version compatibility
  if (packageJson.peerDependencies && packageJson.peerDependencies.obsidian) {
    report += '## Obsidian Compatibility\n\n';
    report += `Required Obsidian version: ${packageJson.peerDependencies.obsidian}\n\n`;
  }

  // Check outdated packages
  try {
    console.log('Checking for outdated packages...');
    report += '## Outdated Packages\n\n';

    // Run npm outdated and capture output
    const outdatedOutput = execSync('pnpm outdated --json', {
      cwd: PLUGIN_DIR,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (outdatedOutput && outdatedOutput.trim() !== '') {
      try {
        const outdated = JSON.parse(outdatedOutput);
        const outdatedPackages = Object.keys(outdated);

        if (outdatedPackages.length > 0) {
          report += 'The following packages are outdated:\n\n';
          report += '| Package | Current | Latest | Type |\n';
          report += '|---------|---------|--------|------|\n';

          outdatedPackages.forEach((pkg) => {
            const info = outdated[pkg];
            report += `| ${pkg} | ${info.current || 'N/A'} | ${info.latest} | ${getUpdateType(info)} |\n`;
          });
        } else {
          report += 'All packages are up to date. ✅\n';
        }
      } catch (e) {
        report += `Error parsing outdated packages: ${e.message}\n`;
        report += 'Raw output: ' + outdatedOutput + '\n';
      }
    } else {
      report += 'All packages are up to date. ✅\n';
    }
  } catch (e) {
    report += `Error checking outdated packages: ${e.message}\n`;
  }

  // Check for security vulnerabilities
  try {
    console.log('Checking for security vulnerabilities...');
    report += '\n## Security Vulnerabilities\n\n';

    try {
      // Run npm audit and capture output
      const auditOutput = execSync('pnpm audit --json', {
        cwd: PLUGIN_DIR,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (auditOutput && auditOutput.trim() !== '') {
        try {
          const audit = JSON.parse(auditOutput);
          const vulnerabilities = audit.vulnerabilities || {};
          const vulnCount = Object.keys(vulnerabilities).length;

          if (vulnCount > 0) {
            report += `Found ${vulnCount} vulnerabilities:\n\n`;
            report += '| Package | Severity | Issue |\n';
            report += '|---------|----------|-------|\n';

            Object.entries(vulnerabilities).forEach(([pkg, info]) => {
              report += `| ${pkg} | ${info.severity} | ${info.via[0].title || 'N/A'} |\n`;
            });

            report += '\nRun `pnpm audit fix` to attempt automatic fixes.\n';
          } else {
            report += 'No security vulnerabilities found. ✅\n';
          }
        } catch (e) {
          report += `Error parsing audit results: ${e.message}\n`;
        }
      } else {
        report += 'No security vulnerabilities found. ✅\n';
      }
    } catch (e) {
      // Check if the error contains audit data
      if (e.stdout && e.stdout.toString().length > 0) {
        try {
          const auditData = JSON.parse(e.stdout.toString());
          const vulnerabilities = auditData.vulnerabilities || {};
          const vulnCount = Object.keys(vulnerabilities).length;

          report += `Found ${vulnCount} vulnerabilities:\n\n`;
          report += '| Package | Severity | Issue |\n';
          report += '|---------|----------|-------|\n';

          Object.entries(vulnerabilities).forEach(([pkg, info]) => {
            report += `| ${pkg} | ${info.severity} | ${info.via[0].title || 'N/A'} |\n`;
          });
        } catch (parseError) {
          report += `Error parsing audit results: ${parseError.message}\n`;
          report += `Output: ${e.stdout.toString()}\n`;
        }
      } else {
        report += `Error running security audit: ${e.message}\n`;
      }
    }
  } catch (e) {
    report += `Error checking security vulnerabilities: ${e.message}\n`;
  }

  // Check for duplicate dependencies
  try {
    console.log('Checking for duplicate dependencies...');
    report += '\n## Duplicate Dependencies\n\n';

    const dedupe = execSync('pnpm dedupe --check', {
      cwd: PLUGIN_DIR,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (dedupe && dedupe.includes('packages can be deduplicated')) {
      report += '⚠️ Found duplicate dependencies that can be deduplicated.\n';
      report += 'Run `pnpm dedupe` to fix.\n';
    } else {
      report += 'No duplicate dependencies found. ✅\n';
    }
  } catch (e) {
    if (e.stdout && e.stdout.toString().includes('packages can be deduplicated')) {
      report += '⚠️ Found duplicate dependencies that can be deduplicated.\n';
      report += 'Run `pnpm dedupe` to fix.\n';
    } else {
      report += `Error checking duplicate dependencies: ${e.message}\n`;
    }
  }

  // Save report
  fs.writeFileSync(REPORT_FILE, report);

  console.log(`✅ Dependency check complete. Report saved to ${REPORT_FILE}`);
  console.log(report);

  // Exit with status code based on results
  if (report.includes('⚠️') || report.includes('Found vulnerabilities')) {
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

// Helper function to determine update type
function getUpdateType(packageInfo) {
  const current = packageInfo.current || '0.0.0';
  const latest = packageInfo.latest;

  if (!current || !latest) return 'Unknown';

  const [currentMajor, currentMinor, currentPatch] = current.split('.').map(Number);
  const [latestMajor, latestMinor, latestPatch] = latest.split('.').map(Number);

  if (latestMajor > currentMajor) return 'Major';
  if (latestMinor > currentMinor) return 'Minor';
  if (latestPatch > currentPatch) return 'Patch';

  return 'Unknown';
}
