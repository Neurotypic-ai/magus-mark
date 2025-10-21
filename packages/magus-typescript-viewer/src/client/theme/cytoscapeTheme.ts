/**
 * Cytoscape stylesheet theme for the dependency graph
 */

import type { StylesheetStyle } from 'cytoscape';

/**
 * Get the Cytoscape stylesheet
 * @returns Array of style definitions
 */
export function getCytoscapeStylesheet(): StylesheetStyle[] {
  return [
    // Node styles - default
    {
      selector: 'node',
      style: {
        'background-color': '#2d3748',
        'border-width': 2,
        'border-color': '#4a5568',
        label: 'data(label)',
        color: '#e2e8f0',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': '12px',
        'font-family': 'Inter, system-ui, sans-serif',
        width: 'label',
        height: 'label',
        padding: '20px',
        'text-wrap': 'wrap',
        'text-max-width': '200px',
      },
    },

    // Package nodes
    {
      selector: 'node[type = "package"]',
      style: {
        'background-color': '#3182ce',
        'border-color': '#2c5aa0',
        shape: 'round-rectangle',
        width: 300,
        height: 100,
        'font-size': '14px',
        'font-weight': 'bold',
      },
    },

    // Module nodes
    {
      selector: 'node[type = "module"]',
      style: {
        'background-color': '#38b2ac',
        'border-color': '#2c7a7b',
        shape: 'round-rectangle',
        width: 250,
        height: 80,
        'font-size': '13px',
      },
    },

    // Group nodes
    {
      selector: 'node[type = "group"]',
      style: {
        'background-color': '#805ad5',
        'border-color': '#6b46c1',
        shape: 'round-rectangle',
        width: 350,
        height: 150,
        'font-size': '14px',
      },
    },

    // Class nodes
    {
      selector: 'node[type = "class"]',
      style: {
        'background-color': '#48bb78',
        'border-color': '#38a169',
        shape: 'rectangle',
        width: 200,
        height: 100,
        'font-size': '12px',
      },
    },

    // Interface nodes
    {
      selector: 'node[type = "interface"]',
      style: {
        'background-color': '#ed8936',
        'border-color': '#dd6b20',
        shape: 'rectangle',
        width: 200,
        height: 100,
        'font-size': '12px',
      },
    },

    // Function nodes
    {
      selector: 'node[type = "function"]',
      style: {
        'background-color': '#f56565',
        'border-color': '#e53e3e',
        shape: 'ellipse',
        width: 150,
        height: 60,
        'font-size': '11px',
      },
    },

    // Enum nodes
    {
      selector: 'node[type = "enum"]',
      style: {
        'background-color': '#9f7aea',
        'border-color': '#805ad5',
        shape: 'diamond',
        width: 120,
        height: 120,
        'font-size': '11px',
      },
    },

    // Type nodes
    {
      selector: 'node[type = "type"]',
      style: {
        'background-color': '#667eea',
        'border-color': '#5a67d8',
        shape: 'octagon',
        width: 130,
        height: 130,
        'font-size': '11px',
      },
    },

    // Selected node
    {
      selector: 'node.selected',
      style: {
        'border-width': 4,
        'border-color': '#00ffff',
        'background-color': '#1a365d',
      },
    },

    // Highlighted node
    {
      selector: 'node.highlighted',
      style: {
        'border-width': 3,
        'border-color': '#61dafb',
        opacity: 1,
      },
    },

    // Dimmed node
    {
      selector: 'node.dimmed',
      style: {
        opacity: 0.3,
      },
    },

    // Search result node
    {
      selector: 'node.search-result',
      style: {
        'border-width': 3,
        'border-color': '#fbbf24',
        'background-color': '#78350f',
      },
    },

    // Edge styles - default
    {
      selector: 'edge',
      style: {
        width: 2,
        'line-color': '#4a5568',
        'target-arrow-color': '#4a5568',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 1.5,
      },
    },

    // Import edges
    {
      selector: 'edge[type = "import"]',
      style: {
        'line-color': '#61dafb',
        'target-arrow-color': '#61dafb',
        width: 2,
      },
    },

    // Export edges
    {
      selector: 'edge[type = "export"]',
      style: {
        'line-color': '#ffd700',
        'target-arrow-color': '#ffd700',
        width: 2,
      },
    },

    // Inheritance edges
    {
      selector: 'edge[type = "inheritance"]',
      style: {
        'line-color': '#9f7aea',
        'target-arrow-color': '#9f7aea',
        'target-arrow-shape': 'triangle',
        width: 3,
      },
    },

    // Implements edges
    {
      selector: 'edge[type = "implements"]',
      style: {
        'line-color': '#ed8936',
        'target-arrow-color': '#ed8936',
        'target-arrow-shape': 'triangle',
        'line-style': 'dashed',
        width: 2,
      },
    },

    // Extends edges
    {
      selector: 'edge[type = "extends"]',
      style: {
        'line-color': '#48bb78',
        'target-arrow-color': '#48bb78',
        'target-arrow-shape': 'triangle',
        width: 2,
      },
    },

    // Dependency edges
    {
      selector: 'edge[type = "dependency"]',
      style: {
        'line-color': '#3182ce',
        'target-arrow-color': '#3182ce',
        width: 2,
      },
    },

    // Dev dependency edges
    {
      selector: 'edge[type = "devDependency"]',
      style: {
        'line-color': '#718096',
        'target-arrow-color': '#718096',
        'line-style': 'dashed',
        width: 1,
      },
    },

    // Peer dependency edges
    {
      selector: 'edge[type = "peerDependency"]',
      style: {
        'line-color': '#805ad5',
        'target-arrow-color': '#805ad5',
        'line-style': 'dotted',
        width: 1,
      },
    },

    // Contains edges (parent-child relationships)
    {
      selector: 'edge[type = "contains"]',
      style: {
        'line-color': '#2d3748',
        'target-arrow-color': '#2d3748',
        'line-style': 'dotted',
        width: 1,
        opacity: 0.5,
      },
    },

    // Highlighted edges
    {
      selector: 'edge.highlighted',
      style: {
        width: 4,
        opacity: 1,
      },
    },

    // Dimmed edges
    {
      selector: 'edge.dimmed',
      style: {
        opacity: 0.2,
      },
    },

    // Search result edges
    {
      selector: 'edge.search-result',
      style: {
        width: 4,
        'line-color': '#fbbf24',
        'target-arrow-color': '#fbbf24',
      },
    },

    // Parent nodes (compound nodes)
    {
      selector: ':parent',
      style: {
        'background-opacity': 0.2,
        'border-opacity': 0.8,
        'text-valign': 'top',
        'text-halign': 'center',
        padding: '30px',
      },
    },
  ];
}
