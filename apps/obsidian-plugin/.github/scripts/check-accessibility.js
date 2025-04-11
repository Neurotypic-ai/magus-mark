#!/usr/bin/env node

/**
 * Accessibility test script for Obsidian Magic plugin
 *
 * This script checks the CSS and HTML components for accessibility issues
 * using axe-core for automated accessibility testing.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');

// Additional configuration for neurodiversity testing
const AXE_CONFIG = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice', 'experimental'],
  },
  rules: {
    'color-contrast': { enabled: true }, // For neurodivergent color perception
    animation: { enabled: true }, // Ensure animations can be paused (for sensory sensitivities)
    'focus-visible': { enabled: true }, // Important for neurodivergent users who rely on keyboard
    'document-title': { enabled: true }, // Clear page identification for cognitive issues
    'aria-hidden-focus': { enabled: true }, // Prevents focus traps that can confuse users
    'page-has-heading-one': { enabled: true }, // Clear document structure for cognitive processing
  },
};

// Function to create a simple HTML test page with our CSS and UI components
const createTestHtml = () => {
  const cssPath = path.resolve(__dirname, '../../styles.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Obsidian Magic Accessibility Test</title>
      <style>
        /* Base Obsidian styles simulation */
        :root {
          --background-primary: #202020;
          --background-secondary: #303030;
          --background-secondary-alt: #404040;
          --background-modifier-border: #505050;
          --text-normal: #dcddde;
          --text-muted: #999;
          --text-on-accent: #fff;
          --interactive-accent: #7f6df2;
          --text-error: #ff6666;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background-color: var(--background-primary);
          color: var(--text-normal);
          padding: 20px;
          line-height: 1.5;
        }
        
        /* Plugin styles */
        ${css}
      </style>
    </head>
    <body>
      <h1>Obsidian Magic Accessibility Test</h1>
      
      <!-- Tag Management View mockup -->
      <div class="tag-section">
        <h3>Your Tags</h3>
        <div class="search-container">
          <span>Filter tags: </span>
          <input type="text" placeholder="Search tags..." aria-label="Filter tags">
        </div>
        <div class="tags-list">
          <div class="tag-item">
            <input type="checkbox" id="tag1" data-tag-id="tag-1">
            <span class="tag-name">#development</span>
            <span class="tag-count">(5)</span>
            <button class="tag-edit-btn" aria-label="Edit tag development">Edit</button>
            <button class="tag-delete-btn" aria-label="Delete tag development">Delete</button>
          </div>
          <div class="tag-item">
            <input type="checkbox" id="tag2" data-tag-id="tag-2">
            <span class="tag-name">#programming</span>
            <span class="tag-count">(3)</span>
            <button class="tag-edit-btn" aria-label="Edit tag programming">Edit</button>
            <button class="tag-delete-btn" aria-label="Delete tag programming">Delete</button>
          </div>
        </div>
      </div>
      
      <!-- Tag Visualization mockup -->
      <div class="visualization-controls">
        <div class="control-container">
          <label for="filter-input">Filter: </label>
          <input id="filter-input" type="text" placeholder="Filter tags..." aria-label="Filter visualization">
        </div>
        <div class="control-container">
          <button aria-label="Reset view">Reset</button>
        </div>
      </div>
      
      <!-- Action buttons mockup -->
      <div class="actions-section">
        <h3>Actions</h3>
        <div class="action-container">
          <button>Batch Tag Selected Files</button>
        </div>
        <div class="action-container">
          <button>Merge Similar Tags</button>
        </div>
      </div>
      
      <!-- Settings mockup -->
      <div class="settings-info">
        <h3>Settings</h3>
        <div>
          <label for="api-key">API Key:</label>
          <input id="api-key" type="password" placeholder="Enter API key" aria-label="API Key">
        </div>
        <div>
          <label for="model">Model:</label>
          <select id="model" aria-label="Select AI model">
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </select>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Main function to run accessibility tests
async function runAccessibilityTests() {
  console.log('Running accessibility tests for Obsidian Magic plugin...');

  // Create test HTML file
  const testHtml = createTestHtml();
  const tempHtmlPath = path.resolve(__dirname, '../../temp-accessibility-test.html');
  fs.writeFileSync(tempHtmlPath, testHtml);

  try {
    // Launch browser and run axe
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`file://${tempHtmlPath}`);

    // Run accessibility tests with axe-core using neurodiversity configuration
    const results = await new AxePuppeteer(page).configure(AXE_CONFIG).analyze();

    // Process results
    if (results.violations.length === 0) {
      console.log('✅ No accessibility violations found!');
    } else {
      console.error(`⚠️ Found ${results.violations.length} accessibility violations:`);

      // Separate violations by category to provide better context
      const criticalViolations = results.violations.filter((v) => v.impact === 'critical');
      const seriousViolations = results.violations.filter((v) => v.impact === 'serious');
      const moderateViolations = results.violations.filter((v) => v.impact === 'moderate');
      const minorViolations = results.violations.filter((v) => v.impact === 'minor');

      // Report critical violations first
      if (criticalViolations.length > 0) {
        console.error('\n🔴 CRITICAL VIOLATIONS:');
        reportViolations(criticalViolations);
      }

      // Report serious violations
      if (seriousViolations.length > 0) {
        console.error('\n🔴 SERIOUS VIOLATIONS:');
        reportViolations(seriousViolations);
      }

      // Report moderate violations
      if (moderateViolations.length > 0) {
        console.error('\n🟠 MODERATE VIOLATIONS:');
        reportViolations(moderateViolations);
      }

      // Report minor violations
      if (minorViolations.length > 0) {
        console.error('\n🟡 MINOR VIOLATIONS:');
        reportViolations(minorViolations);
      }

      // Check for neurodiversity-specific issues
      checkForNeurodiversityIssues(results.violations);

      process.exit(1);
    }

    await browser.close();
  } catch (error) {
    console.error('Error running accessibility tests:', error);
    process.exit(1);
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
  }
}

// Helper function to report violations in a structured way
function reportViolations(violations) {
  violations.forEach((violation, index) => {
    console.error(`\n${index + 1}. ${violation.id}: ${violation.help}`);
    console.error(`   Impact: ${violation.impact}`);
    console.error(`   Description: ${violation.description}`);
    console.error(`   Elements affected: ${violation.nodes.length}`);
    console.error(`   More info: ${violation.helpUrl}`);

    // Show the HTML for the first affected node to help debugging
    if (violation.nodes.length > 0) {
      const node = violation.nodes[0];
      console.error(`   Example HTML: ${node.html}`);
    }
  });
}

// Helper function to check for neurodiversity-specific issues
function checkForNeurodiversityIssues(violations) {
  // Check for issues that might affect neurodivergent users but aren't covered by default WCAG
  const neurodiversityIssues = violations.filter(
    (v) =>
      v.id.includes('color') ||
      v.id.includes('animation') ||
      v.id.includes('motion') ||
      v.id.includes('flashing') ||
      v.id.includes('contrast') ||
      v.id.includes('focus') ||
      v.id.includes('keyboard')
  );

  if (neurodiversityIssues.length > 0) {
    console.error('\n⚠️ NEURODIVERSITY ISSUES:');
    console.error('The following violations may particularly impact neurodivergent users:');

    neurodiversityIssues.forEach((issue, index) => {
      console.error(`\n${index + 1}. ${issue.id}: ${issue.help}`);
      console.error(`   Impact: May affect users with ${getNeurodiversityImpact(issue.id)}`);
      console.error(`   More info: ${issue.helpUrl}`);
    });
  }
}

// Helper function to map accessibility issues to neurodiversity impacts
function getNeurodiversityImpact(issueId) {
  const mapping = {
    color: 'color perception differences, dyslexia',
    animation: 'sensory sensitivities, ADHD, autism',
    motion: 'sensory sensitivities, vestibular disorders, autism',
    flashing: 'photosensitivity, epilepsy, migraines',
    contrast: 'dyslexia, visual processing differences',
    focus: 'ADHD, executive function challenges',
    keyboard: 'motor control differences, focus issues',
  };

  for (const [key, value] of Object.entries(mapping)) {
    if (issueId.includes(key)) {
      return value;
    }
  }

  return 'various neurocognitive differences';
}

runAccessibilityTests();
