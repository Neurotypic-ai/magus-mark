# TypeScript Viewer - Dependency Graph Visualization Tool

## Overview

TypeScript Viewer is a comprehensive tool for analyzing and visualizing TypeScript/JavaScript codebases. It parses
source code using AST analysis, stores the structural information in DuckDB, and provides an interactive React-based
visualization of the dependency graph.

**Key Features**:

- 🔍 **Deep AST Analysis**: Extracts classes, interfaces, methods, properties, and relationships
- 💾 **Persistent Storage**: DuckDB with UUID-based entity linking
- 🎨 **Interactive Visualization**: React Flow with ELK.js hierarchical layout
- ⚡ **Performance**: Web Workers for non-blocking layout, caching at multiple layers
- 🧪 **Deterministic**: UUID v5 for stable entity IDs across re-analysis

## Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 8.0

### Installation

This package is part of the magus-mark monorepo. From the repository root:

```bash
# Install dependencies
pnpm install

# Build the TypeScript viewer
pnpm --filter magus-typescript-viewer build
```

## Architecture

The application consists of several layers:

- **Parser Layer** (`src/server/parsers/`): AST parsing with jscodeshift
- **Data Layer** (`src/server/db/`): DuckDB storage with repository pattern
- **API Layer** (`src/server.ts`): REST API for data access
- **Visualization Layer** (`src/client/`): React + ReactFlow + ELK.js

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Usage

### Analyze a TypeScript Project

Parse a TypeScript project and store its structure in a database:

```bash
cd packages/magus-typescript-viewer
pnpm run analyze /path/to/your/typescript/project
```

This creates a `typescript-viewer.duckdb` file with all analyzed data.

### Visualize the Dependency Graph

Start both the API server and the visualization UI:

```bash
pnpm run dev
```

Then open [http://localhost:4000](http://localhost:4000) in your browser.

**Development Mode**:

- API server runs on port 4001
- Vite dev server runs on port 4000
- Hot module replacement enabled
- Automatic reconnection on server restart

**Production Mode**:

```bash
# Build first
pnpm run build

# Then serve
pnpm run serve
```

## Features

### Interactive Graph Visualization

- **Hierarchical Layout**: ELK.js layered algorithm for clear structure
- **Node Types**: Packages, modules, classes, interfaces
- **Relationship Types**: Dependencies, imports, inheritance, implementations
- **Search & Filter**: Find nodes and filter by relationship type
- **Keyboard Navigation**: Arrow keys to traverse connected nodes
- **Zoom & Pan**: Smooth navigation with mouse/trackpad
- **Details Panel**: View methods, properties, and relationships

### Analysis Capabilities

- **Class Analysis**: Methods, properties, inheritance, implementations
- **Interface Analysis**: Method signatures, property types, extensions
- **Import Tracking**: Cross-module and cross-package dependencies
- **Deterministic IDs**: UUID v5 for stable entity identification
- **Incremental Updates**: Re-analyze only changed files (planned)

### Performance Optimizations

- **Web Workers**: Non-blocking graph layout calculations
- **Multi-layer Caching**: API responses, layout results, LocalStorage
- **Code Splitting**: Separate vendor chunks for React, MUI, ReactFlow
- **Lazy Loading**: On-demand component loading

## Technology Stack

### Backend

- **DuckDB**: Embedded analytical database
- **jscodeshift**: TypeScript/JavaScript AST parsing
- **Commander**: CLI framework
- **Node.js HTTP**: Native HTTP server

### Frontend

- **React 19**: UI framework
- **ReactFlow**: Graph visualization library
- **Material-UI**: Component library
- **ELK.js**: Graph layout algorithm
- **Vite**: Build tool and dev server

### Development

- **TypeScript 5.9**: Type safety
- **Vitest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Database Schema

The schema uses UUID-based entities with the following structure:

```
packages (id, name, version, path)
  ├── dependencies (source_id, target_id, type)
  ├── modules (id, package_id, name, source, ...)
      ├── classes (id, module_id, name, extends_id)
      │   ├── methods (id, parent_id, parent_type, ...)
      │   ├── properties (id, parent_id, parent_type, ...)
      │   └── class_implements (class_id, interface_id)
      ├── interfaces (id, module_id, name)
          ├── methods (id, parent_id, parent_type, ...)
          ├── properties (id, parent_id, parent_type, ...)
          └── interface_extends (interface_id, extended_id)
```

## Testing

Run tests with Vitest:

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test -- --watch

# Coverage
pnpm test -- --coverage
```

## Contributing

This package follows the magus-mark project conventions:

- TypeScript with strict mode
- Repository pattern for data access
- Logger for all output (except CLI user messages)
- Vitest for testing
- Co-located test files

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## License

ISC
