#!/usr/bin/env tsx
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { readWantedLockfile } from '@pnpm/lockfile-file';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '../..');
const PNPM_DIR = path.join(PROJECT_ROOT, 'node_modules/.pnpm');
const MAX_LINES = 10;
const CHANGELOG_NAMES = ['CHANGELOG.md', 'CHANGELOG', 'CHANGELOG.txt', 'changelog.md', 'changelog', 'changelog.txt'];

const args = process.argv.slice(2);
const showChangelog = args.includes('--changelog') || args.includes('-c');
const showWhy = args.includes('--why');
const quiet = args.includes('--quiet');
const outputIdx = args.findIndex((a) => a === '--output' || a === '-o');
const outputDir = outputIdx !== -1 ? args[outputIdx + 1] : undefined;
const summaryFormatIdx = args.findIndex((a) => a === '--summary-format');
const summaryFormat = summaryFormatIdx !== -1 ? (args[summaryFormatIdx + 1] ?? 'json') : 'json';

if ((showChangelog || showWhy || outputDir) && !outputDir) {
  console.error('Error: --output <folder> is required when using --changelog, --why, or for per-package output.');
  process.exit(1);
}

/**
 * Find all versions of each package in the lockfile
 */
async function findMultiVersionPackages(): Promise<Record<string, Set<string>>> {
  try {
    const lockfile = await readWantedLockfile(PROJECT_ROOT, {
      wantedVersions: [],
      ignoreIncompatible: false,
      useGitBranchLockfile: false,
      mergeGitBranchLockfiles: false,
    });

    if (!lockfile?.packages) {
      console.error('Failed to read lockfile or packages section missing');
      process.exit(1);
    }

    const versions: Record<string, Set<string>> = {};

    // Process all packages in the lockfile
    Object.keys(lockfile.packages).forEach((pkgPath) => {
      // Extract package name and version from path
      // Examples:
      // /@babel/code-frame/7.22.13
      // /string-width/4.2.3_ansi-regex@5.0.1
      // Parse package path to get name and version
      const parts = pkgPath.substring(1).split('/');
      if (parts.length === 0) return;

      let name: string;
      let version: string;

      if (parts[0]?.startsWith('@')) {
        // Scoped package
        if (parts.length < 3) return;
        name = `${parts[0]}/${parts[1] ?? ''}`;
        version = parts[2]?.split('_')[0] ?? ''; // Remove peer dependency suffix
      } else {
        // Non-scoped package
        if (parts.length < 2) return;
        name = parts[0] ?? '';
        version = parts[1]?.split('_')[0] ?? ''; // Remove peer dependency suffix
      }

      // Skip packages with complex paths we're not interested in
      if (!version) return;

      // Store versions by package name
      versions[name] ??= new Set();

      if (versions[name]) {
        versions[name]!.add(version);
      }
    });

    // Only return packages with multiple versions
    return Object.fromEntries(Object.entries(versions).filter(([, vers]) => vers.size > 1));
  } catch (err) {
    console.error('Error parsing lockfile:', err);
    process.exit(1);
  }
}

/**
 * Build a dependency graph from the lockfile
 */
interface DepNode {
  name: string;
  version: string;
  dependents: Set<string>; // 'name@version' strings
  dependencies: Set<string>; // 'name@version' strings
}

async function buildDependencyGraph(): Promise<Record<string, DepNode>> {
  const lockfile = await readWantedLockfile(PROJECT_ROOT);
  if (!lockfile?.packages) {
    console.error('Failed to read lockfile or packages section missing');
    process.exit(1);
  }

  // Get all package nodes and dependencies from the lockfile
  const graph: Record<string, DepNode> = {};

  // First pass: Create all nodes
  Object.keys(lockfile.packages).forEach((pkgPath) => {
    const parts = pkgPath.substring(1).split('/');
    if (parts.length === 0) return;

    let name: string;
    let version: string;

    if (parts[0]?.startsWith('@')) {
      // Scoped package
      if (parts.length < 3) return;
      name = `${parts[0]}/${parts[1] ?? ''}`;
      version = parts[2]?.split('_')[0] ?? ''; // Remove peer dependency suffix
    } else {
      // Non-scoped package
      if (parts.length < 2) return;
      name = parts[0] ?? '';
      version = parts[1]?.split('_')[0] ?? ''; // Remove peer dependency suffix
    }

    // Create a unique node key
    const nodeKey = `${name}@${version}`;

    // Add node to graph if not already present
    graph[nodeKey] ??= {
      name,
      version,
      dependents: new Set<string>(),
      dependencies: new Set<string>(),
    };

    // Add dependencies to the node
    const pkg = lockfile.packages[pkgPath];
    if (pkg?.dependencies) {
      Object.entries(pkg.dependencies).forEach(([depName, depVersion]) => {
        if (typeof depVersion === 'string') {
          const depKey = `${depName}@${depVersion}`;
          graph[nodeKey]?.dependencies.add(depKey);
        }
      });
    }
  });

  // Second pass: Connect dependents
  Object.entries(graph).forEach(([nodeKey, node]) => {
    node.dependencies.forEach((depKey) => {
      if (graph[depKey]) {
        graph[depKey].dependents.add(nodeKey);
      }
    });
  });

  // Add importers (project roots) to the graph
  if (lockfile.importers) {
    interface Importer {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
    }

    Object.entries(lockfile.importers).forEach(([importerPath, importer]) => {
      const rootName = importerPath === '.' ? 'root' : importerPath;
      const rootKey = rootName;
      const typedImporter = importer as Importer;

      graph[rootKey] ??= {
        name: rootName,
        version: '',
        dependents: new Set<string>(),
        dependencies: new Set<string>(),
      };

      // Add all dependencies of the importer
      const allDeps = {
        ...typedImporter.dependencies,
        ...typedImporter.devDependencies,
        ...typedImporter.optionalDependencies,
      };

      Object.entries(allDeps ?? {}).forEach(([depName, depVersion]) => {
        // Skip workspace dependencies
        if (typeof depVersion === 'string' && !depVersion.startsWith('link:')) {
          const depKey = `${depName}@${depVersion}`;
          graph[rootKey]?.dependencies.add(depKey);
          if (graph[depKey]) {
            graph[depKey].dependents.add(rootKey);
          }
        }
      });
    });
  }

  return graph;
}

/**
 * Find all paths from roots to a target package
 */
function findAllPathsToPackage(graph: Record<string, DepNode>, pkgName: string, pkgVersions: string[]) {
  const targetNodes = pkgVersions.map((v) => `${pkgName}@${v}`).filter((key) => graph[key]);
  const allPaths: string[][] = [];

  // Find all root nodes
  const rootNodes = Object.entries(graph)
    .filter(
      ([, node]) =>
        node.dependents.size === 0 ||
        node.name === 'root' ||
        node.name.startsWith('apps/') ||
        node.name.startsWith('packages/')
    )
    .map(([key]) => key);

  // BFS to find all paths from roots to target package versions
  function findPaths(startNode: string, targetNode: string) {
    const queue: { node: string; path: string[] }[] = [{ node: startNode, path: [startNode] }];
    const nodePaths: string[][] = [];
    const visitedInSearch = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      const { node, path } = current;

      if (node === targetNode) {
        nodePaths.push([...path]);
        continue;
      }

      if (visitedInSearch.has(node)) continue;
      visitedInSearch.add(node);

      // Add all dependencies to the queue
      const deps = graph[node]?.dependencies ?? new Set<string>();
      deps.forEach((dep) => {
        if (!path.includes(dep)) {
          // Avoid cycles
          queue.push({ node: dep, path: [...path, dep] });
        }
      });
    }

    return nodePaths;
  }

  // Find paths from each root to each target version
  for (const root of rootNodes) {
    for (const target of targetNodes) {
      const paths = findPaths(root, target);
      allPaths.push(...paths);
    }
  }

  // Filter out duplicate paths by converting to string and back
  const uniquePaths = Array.from(new Set(allPaths.map((p) => p.join('->')))).map((p) => p.split('->'));

  return uniquePaths;
}

/**
 * Find the greatest common ancestor(s) for multiple paths
 */
function findGCAs(paths: string[][]): string[] {
  if (paths.length === 0) return [];

  // If there's only one path, all nodes except the last one are potential GCAs
  if (paths.length === 1) {
    const path = paths[0];
    return path ? path.slice(0, -1) : [];
  }

  // Find common prefixes
  const comps: string[][] = [];
  for (let i = 0; i < paths.length; i++) {
    const pathI = paths[i];
    if (!pathI) continue;

    for (let j = i + 1; j < paths.length; j++) {
      const pathJ = paths[j];
      if (!pathJ) continue;

      const commonPrefix: string[] = [];
      const minLen = Math.min(pathI.length, pathJ.length);

      for (let k = 0; k < minLen; k++) {
        const nodeI = pathI[k];
        const nodeJ = pathJ[k];
        if (nodeI && nodeJ && nodeI === nodeJ) {
          commonPrefix.push(nodeI);
        } else {
          break;
        }
      }

      if (commonPrefix.length > 0) {
        comps.push(commonPrefix);
      }
    }
  }

  // If no common prefixes, return empty
  if (comps.length === 0) return [];

  // Find the longest common prefix
  let longestPrefix: string[] = [];
  for (const comp of comps) {
    if (comp.length > longestPrefix.length) {
      longestPrefix = comp;
    }
  }

  // Return the last node of the longest common prefix as the GCA
  return longestPrefix.length > 0 && longestPrefix[longestPrefix.length - 1]
    ? [longestPrefix[longestPrefix.length - 1]]
    : [];
}

/**
 * Get the highest version from a list of versions
 */
function getHighestVersion(versions: string[]): string {
  if (versions.length === 0) return '';

  const validVersions = versions.filter(Boolean);
  return (
    validVersions.sort((a, b) => {
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = i < aParts.length ? aParts[i] : 0;
        const bVal = i < bParts.length ? bParts[i] : 0;

        if (aVal !== bVal) {
          return bVal - aVal; // Descending order
        }
      }

      return 0;
    })[0] || ''
  );
}

function findChangelog(pkg: string, version: string): string | null {
  if (!fs.existsSync(PNPM_DIR)) return null;
  const dirs = fs.readdirSync(PNPM_DIR).filter((d) => d.startsWith(`${pkg.replace('/', '+')}@${version}`));
  for (const dir of dirs) {
    const pkgDir = path.join(PNPM_DIR, dir, 'node_modules', pkg);
    if (fs.existsSync(pkgDir)) {
      for (const changelog of CHANGELOG_NAMES) {
        const changelogPath = path.join(pkgDir, changelog);
        if (fs.existsSync(changelogPath)) return changelogPath;
      }
    }
  }
  return null;
}

function printChangelog(changelogPath: string, write: (line: string) => void) {
  const lines = fs.readFileSync(changelogPath, 'utf8').split('\n').slice(0, MAX_LINES);
  for (const line of lines) {
    write('      ' + line);
  }
  if (lines.length === MAX_LINES) {
    write('      ...');
  }
}

function runPnpmWhy(pkg: string): string {
  try {
    const out = execSync(`pnpm why -r ${pkg}`, { encoding: 'utf8', stdio: 'pipe' });
    return out.trim();
  } catch {
    return '[pnpm why failed]';
  }
}

function renderProgress(current: number, total: number) {
  const width = 30;
  const percent = Math.floor((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const bar = '='.repeat(filled) + '-'.repeat(width - filled);
  process.stdout.write(`\r[${bar}] ${String(percent)}% (${String(current)}/${String(total)})`);
  if (current === total) process.stdout.write('\n');
}

function writeSummary(
  summary: { package: string; versionCount: number; versions: string[]; outputFile: string }[],
  outputDir: string,
  format: string
) {
  if (format === 'json') {
    const summaryPath = path.join(outputDir, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`\nSummary written to: ${summaryPath}`);
  } else if (format === 'markdown' || format === 'md') {
    const summaryPath = path.join(outputDir, 'summary.md');
    const header =
      '| Package | Version Count | Versions | Output File |\n|---------|--------------|----------|-------------|';
    const rows = summary
      .map((s) => `| ${s.package} | ${String(s.versionCount)} | ${s.versions.join(', ')} | ${s.outputFile} |`)
      .join('\n');
    fs.writeFileSync(summaryPath, `${header}\n${rows}\n`, 'utf8');
    console.log(`\nSummary written to: ${summaryPath}`);
  } else if (format === 'csv') {
    const summaryPath = path.join(outputDir, 'summary.csv');
    const header = 'package,versionCount,versions,outputFile';
    const rows = summary
      .map((s) => `${s.package},${String(s.versionCount)},"${s.versions.join(', ')}",${s.outputFile}`)
      .join('\n');
    fs.writeFileSync(summaryPath, `${header}\n${rows}\n`, 'utf8');
    console.log(`\nSummary written to: ${summaryPath}`);
  } else {
    console.error(`Unknown summary format: ${format}`);
  }
}

/**
 * Generate override recommendations for multi-version packages
 */
async function generateOverrideReport(multiVersionPkgs: Record<string, Set<string>>, outputDir: string) {
  const graph = await buildDependencyGraph();
  const report: Record<string, unknown> = {};

  for (const [pkgName, versions] of Object.entries(multiVersionPkgs)) {
    const allVersions = Array.from(versions);
    if (allVersions.length <= 1) continue;

    // Find all paths to this package
    const paths = findAllPathsToPackage(graph, pkgName, allVersions);

    // Find GCAs
    const gcas = findGCAs(paths);

    // Filter out node version info from path nodes
    const cleanPaths = paths.map((path) => path.map((node) => node.split('@')[0]).filter(Boolean));

    // Extract package names from GCAs
    const gcaPkgNames = gcas.map((node) => node.split('@')[0]).filter(Boolean);

    // Determine highest version for override suggestion
    const highestVersion = getHighestVersion(allVersions);

    report[pkgName] = {
      greatestCommonAncestors: gcaPkgNames,
      paths: cleanPaths,
      suggestedOverrides: Object.fromEntries(gcaPkgNames.map((gcaName) => [gcaName, highestVersion])),
    };
  }

  const outPath = path.join(outputDir, 'override-graph.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Override graph written to: ${outPath}`);
}

async function main() {
  // Find packages with multiple versions
  const multiVersionPkgs = await findMultiVersionPackages();
  const packages = Object.entries(multiVersionPkgs);

  if (packages.length === 0) {
    console.log('No packages with multiple versions found.');
    return;
  }

  // Create output directory if needed
  if (outputDir && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Process each multi-version package
  let current = 0;
  const total = packages.length;
  const summary: { package: string; versionCount: number; versions: string[]; outputFile: string }[] = [];

  for (const [pkg, vers] of packages) {
    current++;
    const versionsArr = Array.from(vers);
    const versionCount = versionsArr.length;
    const outFile = outputDir ? `${pkg.replace(/[\/]/g, '_')}.txt` : '';

    summary.push({
      package: pkg,
      versionCount,
      versions: versionsArr,
      outputFile: outFile,
    });

    let pkgLine = `${pkg} - ${String(versionCount)} version${versionCount > 1 ? 's' : ''}: ${versionsArr.join(', ')}`;

    if (!quiet) {
      process.stdout.write(`\u001b[2K\u001b[0G${pkgLine}\n`);
      renderProgress(current, total);
    }

    // Write package details to file if output directory is specified
    if (outputDir) {
      const filePath = path.join(outputDir, outFile);
      const fileStream = fs.createWriteStream(filePath, { flags: 'w' });

      const writeLine = (line: string) => {
        fileStream.write(line + '\n');
      };

      writeLine(`Package: ${pkg}`);
      writeLine(`Versions: ${versionsArr.join(', ')}`);

      // Add changelog info if available
      for (const version of versionsArr) {
        const changelog = findChangelog(pkg, version);
        if (changelog) {
          writeLine(`  - ${version}: CHANGELOG found at ${changelog}`);
          if (showChangelog) printChangelog(changelog, writeLine);
        } else {
          writeLine(`  - ${version}: No changelog found`);
        }
      }

      // Add pnpm why output if requested
      if (showWhy) {
        writeLine('pnpm why output:');
        const why = runPnpmWhy(pkg);
        for (const line of why.split('\n')) {
          writeLine('  ' + line);
        }
      }

      fileStream.end();
    }
  }

  if (!quiet) {
    renderProgress(total, total);
    process.stdout.write('\n');
  }

  // Write summary and override report
  if (outputDir) {
    writeSummary(summary, outputDir, summaryFormat);
    await generateOverrideReport(multiVersionPkgs, outputDir);
    console.log(`Output written to folder: ${outputDir}`);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
