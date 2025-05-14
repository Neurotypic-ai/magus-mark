import type { CSSProperties } from 'react';

import type { DependencyEdgeKind, DependencyKind } from '../components/DependencyGraph/types';

// Graph-specific type definitions
export interface GraphTheme {
  nodes: {
    padding: {
      content: number;
      header: number;
    };
    colors: {
      background: {
        default: string;
        package: string;
      };
      border: string;
    };
    borderRadius: number;
    minDimensions: {
      width: number;
      height: number;
    };
  };
  edges: {
    sizes: {
      width: {
        default: number;
        selected: number;
        inheritance: number;
      };
      label: {
        fontSize: string;
      };
    };
    colors: {
      import: string;
      export: string;
      inheritance: string;
      implements: string;
      dependency: string;
      devDependency: string;
      peerDependency: string;
      default: string;
    };
  };
  layout: {
    spacing: {
      horizontal: number;
      vertical: number;
      edge: number;
      margin: number;
    };
  };
}

// Theme configuration
export const graphTheme: GraphTheme = {
  nodes: {
    padding: {
      content: 16,
      header: 8,
    },
    colors: {
      background: {
        default: '#1a1a1a',
        package: '#2d2d2d',
      },
      border: '#404040',
    },
    borderRadius: 4,
    minDimensions: {
      width: 100,
      height: 30,
    },
  },
  edges: {
    sizes: {
      width: {
        default: 1,
        selected: 2,
        inheritance: 2,
      },
      label: {
        fontSize: '12px',
      },
    },
    colors: {
      import: '#61dafb',
      export: '#ffd700',
      inheritance: '#4caf50',
      implements: '#ff9800',
      dependency: '#f44336',
      devDependency: '#795548',
      peerDependency: '#009688',
      default: '#404040',
    },
  },
  layout: {
    spacing: {
      horizontal: 50, // Base spacing between nodes
      vertical: 80, // Base spacing between ranks
      edge: 20, // Base spacing between edges
      margin: 30, // Base margin around the graph
    },
  },
};

// Create a type-safe theme instance for use in helper functions
const defaultTheme = graphTheme as Required<GraphTheme>;

// Node Styles
export function getNodeStyle(type: DependencyKind): CSSProperties {
  const baseStyle: CSSProperties = {
    padding: `${String(defaultTheme.nodes.padding.header)}px ${String(defaultTheme.nodes.padding.content)}px`,
    borderRadius: defaultTheme.nodes.borderRadius,
    border: `1px solid ${defaultTheme.nodes.colors.border}`,
    backgroundColor: defaultTheme.nodes.colors.background.default,
    minWidth: defaultTheme.nodes.minDimensions.width,
    minHeight: defaultTheme.nodes.minDimensions.height,
  };

  switch (type) {
    case 'package':
      return {
        ...baseStyle,
        backgroundColor: defaultTheme.nodes.colors.background.package,
        borderRadius: defaultTheme.nodes.borderRadius * 2,
      };
    case 'group':
      return {
        ...baseStyle,
        backgroundColor: defaultTheme.nodes.colors.background.package,
        borderStyle: 'dashed',
      };
    default:
      return baseStyle;
  }
}

// Edge Styles
export function getEdgeStyle(type: DependencyEdgeKind): CSSProperties {
  const baseStyle: CSSProperties = {
    stroke: defaultTheme.edges.colors.default,
    strokeWidth: defaultTheme.edges.sizes.width.default,
  };

  switch (type) {
    case 'inheritance':
      return {
        ...baseStyle,
        stroke: defaultTheme.edges.colors.inheritance,
        strokeWidth: defaultTheme.edges.sizes.width.inheritance,
      };
    case 'implements':
      return {
        ...baseStyle,
        stroke: defaultTheme.edges.colors.implements,
      };
    case 'import':
      return {
        ...baseStyle,
        stroke: defaultTheme.edges.colors.import,
      };
    case 'export':
      return {
        ...baseStyle,
        stroke: defaultTheme.edges.colors.export,
      };
    case 'dependency':
      return {
        ...baseStyle,
        stroke: defaultTheme.edges.colors.dependency,
      };
    case 'devDependency':
      return {
        ...baseStyle,
        stroke: defaultTheme.edges.colors.devDependency,
      };
    case 'peerDependency':
      return {
        ...baseStyle,
        stroke: defaultTheme.edges.colors.peerDependency,
      };
    default:
      return baseStyle;
  }
}

// Node Details Styles
export const nodeDetailsStyles = {
  container: {
    bgcolor: 'background.paper',
    p: 2,
    borderRadius: 1,
    boxShadow: 1,
    color: 'text.primary',
  },
  title: {
    m: 0,
    mb: 1,
    fontSize: '1.2rem',
    fontWeight: 500,
  },
  typeLabel: {
    m: 0,
    mb: 1,
    color: 'text.secondary',
    fontSize: '0.875rem',
  },
  itemContainer: {
    fontSize: '0.875rem',
    mb: 0.5,
  },
  sectionContainer: {
    fontSize: '0.875rem',
    mt: 1,
  },
};

// Graph Search Styles
export const graphSearchStyles = {
  container: {
    display: 'flex',
    gap: 1,
    mb: 2,
  },
  input: {
    p: 1,
    borderRadius: 1,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
    color: 'text.primary',
    fontSize: '0.875rem',
    '&:focus': {
      outline: 'none',
      borderColor: 'primary.main',
    },
  },
  button: {
    px: 2,
    py: 1,
    borderRadius: 1,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
    color: 'text.primary',
    cursor: 'pointer',
    fontSize: '0.875rem',
    '&:hover': {
      bgcolor: 'action.hover',
    },
  },
};

// Graph Controls Styles
export const graphControlsStyles = {
  button: {
    p: 1,
    bgcolor: 'background.paper',
    color: 'text.primary',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
    cursor: 'pointer',
    minWidth: 32,
    '&:hover': {
      bgcolor: 'action.hover',
    },
  },
  filterPanel: {
    p: 2,
    borderRadius: 1,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
  },
  filterTitle: {
    m: 0,
    mb: 1,
    color: 'text.primary',
    fontSize: '1rem',
  },
  filterContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0.5,
  },
  filterLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    color: 'text.primary',
    fontSize: '0.875rem',
  },
  controlsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  buttonGroup: {
    display: 'flex',
    gap: 1,
  },
};

// Edge Color Helper
export function getEdgeColor(type: DependencyEdgeKind): string {
  switch (type) {
    case 'inheritance':
      return defaultTheme.edges.colors.inheritance;
    case 'implements':
      return defaultTheme.edges.colors.implements;
    case 'import':
      return defaultTheme.edges.colors.import;
    case 'export':
      return defaultTheme.edges.colors.export;
    case 'dependency':
      return defaultTheme.edges.colors.dependency;
    case 'devDependency':
      return defaultTheme.edges.colors.devDependency;
    case 'peerDependency':
      return defaultTheme.edges.colors.peerDependency;
    default:
      return defaultTheme.edges.colors.default;
  }
}
