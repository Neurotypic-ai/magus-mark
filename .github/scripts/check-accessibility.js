#!/usr/bin/env node

/**
 * Accessibility verification script for Obsidian Magic
 * This script uses axe-core and Puppeteer to check WCAG compliance
 * for the plugin's UI components.
 */

const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  outputDir: path.resolve(__dirname, '../../reports/accessibility'),
  htmlReportPath: path.resolve(__dirname, '../../reports/accessibility/report.html'),
  jsonReportPath: path.resolve(__dirname, '../../reports/accessibility/report.json'),
  testPagePath: path.resolve(__dirname, '../../apps/obsidian-plugin/tests/fixtures/test-page.html')
};

// Create output directory if it doesn't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Initialize HTML report
const htmlReportHeader = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Test Report - Obsidian Magic</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.5; margin: 0; padding: 20px; color: #333; }
    h1 { color: #1e293b; }
    h2 { margin-top: 2em; color: #334155; }
    .summary { background-color: #f1f5f9; padding: 1em; border-radius: 8px; margin-bottom: 2em; }
    .violation { background-color: #fee2e2; padding: 1em; margin-bottom: 1em; border-radius: 8px; }
    .violation h3 { color: #b91c1c; margin-top: 0; }
    .pass { background-color: #dcfce7; padding: 1em; margin-bottom: 1em; border-radius: 8px; }
    .pass h3 { color: #15803d; margin-top: 0; }
    .warning { background-color: #fef3c7; padding: 1em; margin-bottom: 1em; border-radius: 8px; }
    .warning h3 { color: #92400e; margin-top: 0; }
    pre { background-color: #f8fafc; padding: 1em; overflow-x: auto; border-radius: 4px; }
    code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; }
    .impact-critical { border-left: 5px solid #dc2626; }
    .impact-serious { border-left: 5px solid #ea580c; }
    .impact-moderate { border-left: 5px solid #f59e0b; }
    .impact-minor { border-left: 5px solid #6366f1; }
  </style>
</head>
<body>
  <h1>Accessibility Test Report - Obsidian Magic</h1>
  <div class="summary">
    <h2>Summary</h2>
    <div id="summary-content"></div>
  </div>
  <h2>Detailed Results</h2>
  <div id="results"></div>
</body>
</html>
`;

async function runAccessibilityTests() {
  console.log('Starting accessibility testing...');
  
  // Check if test page exists
  if (!fs.existsSync(config.testPagePath)) {
    console.error(`Test page not found at ${config.testPagePath}`);
    console.log('Creating a minimal test page for accessibility testing...');
    
    // Create a minimal test page with plugin components
    const minimalTestPage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Obsidian Magic Accessibility Test</title>
      <link rel="stylesheet" href="../../dist/styles.css">
    </head>
    <body>
      <div id="app">
        <div class="tag-container">
          <div class="tag">software-development</div>
          <div class="tag">frontend</div>
          <div class="tag">react</div>
        </div>
        <button class="add-tag-button">Add Tag</button>
        <div class="tag-dialog">
          <h3>Add New Tag</h3>
          <input type="text" placeholder="Enter tag name" aria-label="Tag name">
          <div class="button-container">
            <button class="cancel-button">Cancel</button>
            <button class="submit-button">Add</button>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // Create the fixtures directory if it doesn't exist
    const fixturesDir = path.dirname(config.testPagePath);
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    
    // Write the minimal test page
    fs.writeFileSync(config.testPagePath, minimalTestPage);
    console.log(`Created test page at ${config.testPagePath}`);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setBypassCSP(true);
    
    console.log(`Loading test page from ${config.testPagePath}`);
    await page.goto(`file://${config.testPagePath}`);
    
    console.log('Running axe-core accessibility tests...');
    const results = await new AxePuppeteer(page).analyze();
    
    // Save JSON report
    fs.writeFileSync(config.jsonReportPath, JSON.stringify(results, null, 2));
    console.log(`JSON report saved to ${config.jsonReportPath}`);
    
    // Generate HTML report
    let htmlReport = htmlReportHeader;
    
    // Summary section
    const summaryContent = `
      <p>Test completed on ${new Date().toLocaleString()}</p>
      <p><strong>Violations:</strong> ${results.violations.length}</p>
      <p><strong>Passes:</strong> ${results.passes.length}</p>
      <p><strong>Inapplicable Rules:</strong> ${results.inapplicable.length}</p>
      <p><strong>Incomplete Tests:</strong> ${results.incomplete.length}</p>
    `;
    
    // Violations section
    let resultsContent = '';
    if (results.violations.length > 0) {
      resultsContent += '<h2>Violations</h2>';
      results.violations.forEach(violation => {
        resultsContent += `
          <div class="violation impact-${violation.impact}">
            <h3>${violation.help} (${violation.id})</h3>
            <p><strong>Impact:</strong> ${violation.impact}</p>
            <p>${violation.description}</p>
            <p><strong>WCAG:</strong> ${violation.tags.filter(t => t.startsWith('wcag')).join(', ')}</p>
            <h4>Affected Elements:</h4>
            <ul>
              ${violation.nodes.map(node => `<li><pre><code>${escapeHtml(node.html)}</code></pre><p>${node.failureSummary}</p></li>`).join('')}
            </ul>
            <p><a href="${violation.helpUrl}" target="_blank" rel="noopener">Learn more</a></p>
          </div>
        `;
      });
    } else {
      resultsContent += '<div class="pass"><h3>No accessibility violations found!</h3></div>';
    }
    
    // Replace placeholders in the HTML template
    htmlReport = htmlReport.replace('<div id="summary-content"></div>', summaryContent);
    htmlReport = htmlReport.replace('<div id="results"></div>', resultsContent);
    
    // Save HTML report
    fs.writeFileSync(config.htmlReportPath, htmlReport);
    console.log(`HTML report saved to ${config.htmlReportPath}`);
    
    // Output summary to console
    console.log('\nAccessibility Test Summary:');
    console.log(`- Violations: ${results.violations.length}`);
    console.log(`- Passes: ${results.passes.length}`);
    console.log(`- Inapplicable Rules: ${results.inapplicable.length}`);
    console.log(`- Incomplete Tests: ${results.incomplete.length}`);
    
    // Fail the process if violations are found
    if (results.violations.length > 0) {
      console.error('\nAccessibility violations found. See the reports for details.');
      process.exit(1);
    } else {
      console.log('\nNo accessibility violations found!');
    }
  } catch (error) {
    console.error('Error running accessibility tests:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Helper function to escape HTML in code examples
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Run tests
runAccessibilityTests(); 