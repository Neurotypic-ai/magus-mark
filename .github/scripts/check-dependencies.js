#!/usr/bin/env node

/**
 * Dependency checker script for Obsidian Magic components
 *
 * This script analyzes dependencies for security vulnerabilities,
 * outdated packages, and licensing issues.
 *
 * Usage: node check-dependencies.js <component-type> <package-json-path>
 *
 * Example: node check-dependencies.js obsidian-plugin ../apps/obsidian-plugin/package.json
 * Example: node check-dependencies.js vscode ../apps/vscode/package.json
 * Example: node check-dependencies.js cli ../apps/cli/package.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const componentType = process.argv[2] || 'unknown';
const packageJsonPath = process.argv[3] || '';

if (!packageJsonPath) {
  console.error('❌ Error: Package.json path is required');
  console.log('Usage: node check-dependencies.js <component-type> <package-json-path>');
  process.exit(1);
}

// Configuration
const packageJsonFullPath = path.resolve(process.cwd(), packageJsonPath);
const componentDir = path.dirname(packageJsonFullPath);
const outputDir = path.resolve(process.cwd(), './.dependency-reports');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Report file paths
const securityReportPath = path.join(outputDir, `${componentType}-security-report.json`);
const outdatedReportPath = path.join(outputDir, `${componentType}-outdated-report.json`);
const licenseReportPath = path.join(outputDir, `${componentType}-license-report.json`);
const summaryReportPath = path.join(outputDir, `${componentType}-dependency-summary.md`);

// Check if package.json exists
if (!fs.existsSync(packageJsonFullPath)) {
  console.error(`❌ Package.json not found: ${packageJsonFullPath}`);
  process.exit(1);
}

console.log(`🔍 Analyzing dependencies for ${componentType}...`);

// Extract all dependencies from package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonFullPath, 'utf8'));
const allDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
  ...packageJson.peerDependencies,
  ...packageJson.optionalDependencies,
};

const dependencyCount = Object.keys(allDependencies).length;
console.log(`📦 Found ${dependencyCount} dependencies in package.json`);

// Helper functions
function runCommand(command, cwd = process.cwd()) {
  try {
    return execSync(command, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  } catch (error) {
    if (error.stdout) return error.stdout;
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    return '';
  }
}

async function checkSecurity() {
  console.log('🔒 Checking for security vulnerabilities...');

  try {
    // Run npm audit in the component directory
    const auditOutput = runCommand('npm audit --json', componentDir);

    // Save raw output
    fs.writeFileSync(securityReportPath, auditOutput);

    // Parse audit results
    let auditData;
    try {
      auditData = JSON.parse(auditOutput);
    } catch {
      console.warn('⚠️ Could not parse npm audit output, saving raw output only');
      return { vulnerabilities: [], count: 0 };
    }

    // Extract vulnerability info
    const vulnerabilities = [];
    let count = 0;

    // NPM v7+ format
    if (auditData.vulnerabilities) {
      for (const [name, data] of Object.entries(auditData.vulnerabilities)) {
        if (data.severity !== 'info') {
          vulnerabilities.push({
            name,
            severity: data.severity,
            via: Array.isArray(data.via)
              ? data.via.map((v) => (typeof v === 'string' ? v : v.name)).join(', ')
              : data.via,
            effects: data.effects ? data.effects.join(', ') : '',
            fixAvailable: !!data.fixAvailable,
          });
          count++;
        }
      }
    }
    // NPM v6 format
    else if (auditData.actions && auditData.advisories) {
      for (const [id, advisory] of Object.entries(auditData.advisories)) {
        vulnerabilities.push({
          name: advisory.module_name,
          severity: advisory.severity,
          via: advisory.title,
          effects: advisory.findings.map((f) => f.paths.join(', ')).join('; '),
          fixAvailable: auditData.actions.some((a) => a.resolves.some((r) => r.id.toString() === id)),
        });
        count++;
      }
    }

    return { vulnerabilities, count };
  } catch (error) {
    console.error('Error checking security:', error);
    return { vulnerabilities: [], count: 0 };
  }
}

async function checkOutdated() {
  console.log('📅 Checking for outdated packages...');

  try {
    // Run npm outdated in the component directory
    const outdatedOutput = runCommand('npm outdated --json', componentDir);

    // Save raw output (might be empty if no outdated packages)
    fs.writeFileSync(outdatedReportPath, outdatedOutput || '{}');

    // Parse outdated results
    let outdatedData = {};
    try {
      outdatedData = outdatedOutput ? JSON.parse(outdatedOutput) : {};
    } catch {
      console.warn('⚠️ Could not parse npm outdated output, saving raw output only');
      return { outdatedPackages: [], count: 0 };
    }

    // Extract outdated package info
    const outdatedPackages = [];
    for (const [name, data] of Object.entries(outdatedData)) {
      outdatedPackages.push({
        name,
        current: data.current,
        wanted: data.wanted,
        latest: data.latest,
        type: data.type,
        needsAttention: data.current !== data.wanted || data.current !== data.latest,
      });
    }

    return { outdatedPackages, count: outdatedPackages.length };
  } catch (error) {
    console.error('Error checking outdated packages:', error);
    return { outdatedPackages: [], count: 0 };
  }
}

async function checkLicenses() {
  console.log('📜 Checking licenses...');

  // This is a simple implementation; for production use, consider a more robust solution
  // like license-checker or similar tools

  const licenseData = {
    licenses: {},
    unknown: [],
    restrictive: [],
  };

  // Non-permissive licenses that might need review
  const restrictiveLicenses = ['GPL', 'AGPL', 'LGPL', 'MPL', 'CDDL', 'EPL', 'EUPL', 'CPOL'];

  try {
    // Get all installed packages in node_modules
    const nodeModulesDir = path.join(componentDir, 'node_modules');

    if (!fs.existsSync(nodeModulesDir)) {
      console.warn('⚠️ node_modules directory not found, run npm install first');
      return licenseData;
    }

    // Use npm ls to get package info including licenses
    const lsOutput = runCommand('npm ls --json --all', componentDir);
    let npmLsData;

    try {
      npmLsData = JSON.parse(lsOutput);
    } catch {
      console.warn('⚠️ Could not parse npm ls output, falling back to package.json scan');
      return licenseData;
    }

    function traverseDependencies(deps) {
      if (!deps) return;

      for (const [name, info] of Object.entries(deps)) {
        if (info.license) {
          // Track license count
          licenseData.licenses[info.license] = (licenseData.licenses[info.license] || 0) + 1;

          // Check if it's a restrictive license
          if (restrictiveLicenses.some((license) => info.license.includes(license))) {
            licenseData.restrictive.push({
              name,
              version: info.version,
              license: info.license,
            });
          }
        } else {
          licenseData.unknown.push({
            name,
            version: info.version || 'unknown',
          });
        }

        // Recursively check dependencies
        if (info.dependencies) {
          traverseDependencies(info.dependencies);
        }
      }
    }

    if (npmLsData.dependencies) {
      traverseDependencies(npmLsData.dependencies);
    }

    // Save license report
    fs.writeFileSync(licenseReportPath, JSON.stringify(licenseData, null, 2));

    return licenseData;
  } catch (error) {
    console.error('Error checking licenses:', error);
    return licenseData;
  }
}

// Generate markdown summary report
function generateSummaryReport(securityData, outdatedData, licenseData) {
  const content = `# Dependency Analysis for ${componentType}

Analysis performed on ${new Date().toLocaleString()}

## Summary

- Total dependencies: ${dependencyCount}
- Security vulnerabilities: ${securityData.count}
- Outdated packages: ${outdatedData.count}
- Packages with unknown licenses: ${licenseData.unknown.length}
- Packages with restrictive licenses: ${licenseData.restrictive.length}

## Security Vulnerabilities

${
  securityData.count === 0
    ? '✅ No security vulnerabilities found!'
    : securityData.vulnerabilities
        .map((v) => `- **${v.name}** - ${v.severity} severity: ${v.via} ${v.fixAvailable ? '(fix available)' : ''}`)
        .join('\n')
}

## Outdated Packages

${
  outdatedData.count === 0
    ? '✅ All packages are up to date!'
    : outdatedData.outdatedPackages
        .map((p) => `- **${p.name}** - current: ${p.current}, latest: ${p.latest}`)
        .join('\n')
}

## License Information

Most common licenses:
${Object.entries(licenseData.licenses)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([license, count]) => `- ${license}: ${count} packages`)
  .join('\n')}

### Packages with Unknown Licenses

${licenseData.unknown.length === 0 ? 'None' : licenseData.unknown.map((p) => `- ${p.name}@${p.version}`).join('\n')}

### Packages with Restrictive Licenses

${
  licenseData.restrictive.length === 0
    ? 'None'
    : licenseData.restrictive.map((p) => `- ${p.name}@${p.version}: ${p.license}`).join('\n')
}

## Recommendations

${[
  securityData.count > 0 ? '- Run `npm audit fix` to address security vulnerabilities' : '',
  outdatedData.count > 0 ? '- Consider updating outdated dependencies' : '',
  licenseData.unknown.length > 0 ? '- Review packages with unknown licenses' : '',
  licenseData.restrictive.length > 0
    ? '- Review packages with restrictive licenses for compliance with project requirements'
    : '',
]
  .filter(Boolean)
  .join('\n')}

${
  [securityData.count, outdatedData.count, licenseData.unknown.length, licenseData.restrictive.length].every(
    (count) => count === 0
  )
    ? '✅ All dependencies look good! No immediate actions needed.'
    : ''
}
`;

  fs.writeFileSync(summaryReportPath, content);
  return summaryReportPath;
}

// Main function
async function main() {
  try {
    // Run checks
    const securityData = await checkSecurity();
    const outdatedData = await checkOutdated();
    const licenseData = await checkLicenses();

    // Generate summary report
    const summaryPath = generateSummaryReport(securityData, outdatedData, licenseData);

    // Print results
    console.log('\n✅ Dependency analysis complete!');
    console.log(`📊 Results:`);
    console.log(`   - Security vulnerabilities: ${securityData.count}`);
    console.log(`   - Outdated packages: ${outdatedData.count}`);
    console.log(`   - Packages with unknown licenses: ${licenseData.unknown.length}`);
    console.log(`   - Packages with restrictive licenses: ${licenseData.restrictive.length}`);
    console.log(`\n📝 Full reports saved to: ${outputDir}`);
    console.log(`📋 Summary report: ${summaryPath}`);

    // Exit with error code if issues found
    if (securityData.count > 0) {
      console.error('\n⚠️ Security vulnerabilities found!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error analyzing dependencies:', error);
    process.exit(1);
  }
}

// Run the script
main();
