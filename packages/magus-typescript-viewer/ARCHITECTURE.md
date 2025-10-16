# TypeScript Viewer Architecture

## Overview

The TypeScript Viewer is a full-stack application that analyzes TypeScript codebases and visualizes their dependency graphs. It consists of three main layers:

1. **Parser Layer**: AST parsing and code analysis
2. **Data Layer**: DuckDB storage and repository pattern
3. **Visualization Layer**: React-based interactive graph UI

## Architecture Layers

### 1. Parser Layer (`src/server/parsers/`)

**Purpose**: Parse TypeScript/JavaScript files and extract structural information.

**Key Components**:
- `PackageParser`: Orchestrates package-level parsing, reads package.json, and discovers all modules
- `ModuleParser`: Uses jscodeshift to parse individual TypeScript files and extract:
  - Classes and their methods/properties
  - Interfaces and their signatures
  - Imports and exports
  - Type relationships (inheritance, implements)

**Technology**:
- `jscodeshift`: AST transformation and analysis
- `read-pkg`: Package.json parsing
- UUID v5: Deterministic ID generation

### 2. Data Layer (`src/server/db/`)

**Purpose**: Persist analyzed code structure in a queryable format.

**Key Components**:

#### Database Adapter Pattern
- `IDatabaseAdapter`: Interface for database operations
- `DuckDBAdapter`: Production implementation using @duckdb/node-api
- `MockAdapter`: Testing implementation

#### Repository Pattern
- `BaseRepository`: Abstract base with common CRUD operations
- Entity-specific repositories:
  - `PackageRepository`: Package management with dependencies
  - `ModuleRepository`: Module tracking and file locations
  - `ClassRepository`: Class definitions with inheritance
  - `InterfaceRepository`: Interface definitions with extensions
  - `MethodRepository`: Method signatures and parameters
  - `PropertyRepository`: Property definitions
  - `ParameterRepository`: Method parameters

**Database Schema**:
- UUID-based primary keys (CHAR(36))
- Foreign key relationships for data integrity
- Denormalized IDs (package_id, module_id) for query performance
- Polymorphic relationships (parent_type: 'class' | 'interface')

**Technology**:
- DuckDB: Embedded analytical database with native UUID support
- SQL schema with constraints and indexes

### 3. Server Layer (`src/server/`)

**Purpose**: Provide REST API for visualization clients.

**Key Components**:
- `ApiServerResponder`: Handles database queries and data enrichment
- HTTP server (Node.js native http module)
- CORS support for local development

**Endpoints**:
- `GET /packages`: List all packages with metadata
- `GET /modules?packageId=<id>`: Get modules for a package with full entity hydration

### 4. Visualization Layer (`src/client/`)

**Purpose**: Interactive dependency graph visualization.

**Key Components**:

#### Graph Rendering
- `DependencyGraph`: Main graph component using ReactFlow
- `DependencyNode`: Custom node renderer with methods/properties display
- `GraphControls`: Zoom, filter, and layout controls
- `GraphSearch`: Node search and path highlighting

#### Layout Processing
- `LayoutProcessor`: Dagre-based hierarchical layout
- `WebWorkerLayoutProcessor`: Offloads layout to web worker
- `GraphLayoutWorker`: ELK.js layered layout algorithm

#### State Management
- `GraphContext`: React Context for graph state
- `GraphProvider`: Provides nodes, edges, and selection state
- Local Storage caching for performance

**Technology**:
- React 19 with Hooks
- ReactFlow (@xyflow/react): Graph rendering
- Material-UI: UI components
- ELK.js: Graph layout algorithms
- Web Workers: Offload CPU-intensive layout

### 5. CLI Layer (`src/server/cli/`)

**Purpose**: Command-line interface for analysis and serving.

**Commands**:
- `analyze <dir>`: Parse TypeScript project and save to database
- `serve [file]`: Start visualization server with Vite dev server

**Technology**:
- Commander: CLI framework
- Ora: Progress spinners
- Chalk: Colored output

## Data Flow

### Analysis Flow
```
TypeScript Files
  → PackageParser
    → ModuleParser (per file)
      → jscodeshift AST parsing
        → Entity extraction (classes, interfaces, etc.)
          → UUID generation
            → Repository.create()
              → DuckDB storage
```

### Visualization Flow
```
HTTP Request
  → ApiServerResponder
    → Repository queries
      → DuckDB data
        → Entity hydration (methods, properties, etc.)
          → JSON serialization
            → GraphDataAssembler
              → createGraphNodes/Edges
                → WebWorkerLayoutProcessor (ELK.js)
                  → ReactFlow rendering
```

## Key Design Patterns

### 1. Repository Pattern
All database access goes through repository classes that:
- Encapsulate SQL queries
- Handle entity hydration (loading related data)
- Provide type-safe interfaces
- Log operations for debugging

### 2. Adapter Pattern
Database operations abstracted behind `IDatabaseAdapter`:
- Swap implementations (DuckDB vs Mock) without changing repositories
- Consistent query/transaction interface
- Testing without database dependencies

### 3. UUID-based Linking
All entities use deterministic UUIDs (v5):
- Stable across re-analysis
- No auto-increment complications
- Namespaced by entity type
- Reproducible for testing

### 4. Web Worker Offloading
CPU-intensive layout calculations run in web worker:
- Prevents UI blocking
- Falls back to synchronous if workers unavailable
- Uses ELK.js layered algorithm for hierarchical graphs

### 5. Singleton Caches
Performance optimization with singleton caches:
- `GraphDataCache`: API response caching
- `PerformanceMetrics`: Render time tracking

## Performance Considerations

1. **Lazy Loading**: Components loaded on demand
2. **Code Splitting**: Vite manual chunks for vendors
3. **Memoization**: Layout results cached
4. **Web Workers**: Non-blocking layout processing
5. **LocalStorage**: Client-side graph caching
6. **Database Indexes**: Fast lookups on package_id, filename
7. **Denormalization**: Redundant IDs avoid expensive joins

## Testing Strategy

The package uses Vitest for testing:

1. **Unit Tests**: Pure logic (UUID generation, utilities)
2. **Integration Tests**: Repository + MockAdapter
3. **Component Tests**: React components with @testing-library/react
4. **Mock Strategies**:
   - MockAdapter for database-free tests
   - Fetch mocks for API tests
   - Partial mocks for complex dependencies

## Future Enhancements

Potential improvements identified but not yet implemented:

1. **Result Pattern**: Replace throw-based errors with Result<T, E>
2. **Incremental Updates**: Track file changes and update only affected entities
3. **Real-time Collaboration**: WebSocket support for multi-user sessions
4. **Export Visualization**: Complete export chain analysis
5. **Dependency Analysis**: Circular dependency detection
6. **Performance Profiling**: Built-in performance analysis tools

