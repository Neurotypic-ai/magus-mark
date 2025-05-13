# Comprehensive Database and Code Review Plan

## Progress Update (2024-02-03)

### Completed Tasks

1. Defined and updated core type definitions; migrated all identifier fields from 'uuid' to 'id' and removed static
   create methods.
2. Implemented deterministic UUID generation utilities and repository DTOs.
3. Established a comprehensive DuckDB schema with native UUID support and denormalized fields (e.g., package_id,
   module_id, parent_id).
4. Restructured the database adapter pattern and integrated Repository Interfaces for CRUD operations.
5. Updated parsers (PackageParser, ModuleParser) to output DTOs that match repository contracts.
6. Revised CLI and visualization components for production-grade integration (no more fake sample data in App.tsx).

### Current Focus

1. Final bug fixes, including resolving type mismatches (e.g., removing unsupported properties like parent_type in
   Method and Property, ensuring Date values are correctly passed).
2. Integration of parsers with updated repository DTOs; ensuring robust handling of circular dependencies and caching.
3. Strengthening error handling and transaction management in the DuckDB adapter and repository layers.
4. Transitioning from sample data in App.tsx to a fully live production integration.

### Next Steps

1. Complete validation of parser outputs to ensure DTO conformity with repository contracts.
2. Finalize repository implementations with robust error handling and transaction support.
3. Update migration and schema verification scripts for DuckDB, ensuring native UUID support and enforcement of
   denormalized fields.
4. Conduct comprehensive end-to-end integration tests using live codebase data.
5. Update documentation and changelog to reflect all structural and type system changes.
6. Ongoing performance optimizations and enhancements to CLI and visualization components.

## Overview

This project aims to recreate a tool that generates and visualizes a dependency graph for a TypeScript monorepo. The
tool will:

- Parse package.json files (using libraries like read-pkg) to gather dependencies (dependencies, devDependencies,
  peerDependencies).
- Build a dependency graph starting from the package level down to modules (files) and their respective exports,
  imports, and other symbols. We should be able to generate it file by file and then merge the results together.
- Cache and export the generated graph data into DuckDB for later analysis and reporting. Assure that we can handle the
  by-commit data to visualize changes over time.
- Normalize various import/export patterns through a series of codemods (using jscodeshift).
- Provide Mermaid diagrams that we can use to debug the dependency graph and parsing logic.
- Provide an interactive visualization using React Flow.
- Leverage a command-line interface (using yargs) for flexible tool interactions and configuration.

Since this is a solo developer project, the UI/UX will be kept to the bare minimum in terms of CSS and design—focus is
on functionality rather than polished visuals.

## Technology Stack & Dependencies

### 1. React Flow Visualization

```typescript
// src/components/DependencyGraph.tsx
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background
} from 'react-flow-renderer';

export const DependencyGraph: React.FC<{
  nodes: Node[];
  edges: Edge[];
}> = ({ nodes, edges }) => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};
```

### 2. Mermaid Integration

```typescript
// src/diagrams/MermaidGenerator.ts
import mermaid from 'mermaid';

export class MermaidGenerator {
  generateClassDiagram(graph: Graph): string {
    let diagram = 'classDiagram\n';

    for (const [_, node] of graph.nodes) {
      if (node.type === 'package') {
        const pkg = node.data as IPackage;
        diagram += `class ${pkg.name}\n`;
      }
    }

    return diagram;
  }
}
```

### 3. CLI Implementation

```typescript
// src/cli/index.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export function cli() {
  return yargs(hideBin(process.argv))
    .command(
      'analyze [dir]',
      'Analyze a directory',
      (yargs) => {
        return yargs.positional('dir', {
          describe: 'Directory to analyze',
          default: '.',
        });
      },
      async (argv) => {
        // Implementation
      }
    )
    .command('generate-diagram [format]', 'Generate a diagram', (yargs) => {
      return yargs.positional('format', {
        describe: 'Diagram format',
        choices: ['mermaid', 'react-flow'],
        default: 'react-flow',
      });
    })
    .help().argv;
}
```

## Additional Implementation Context & Library Guidelines

To ensure a robust, maintainable, and modern code-level implementation, we incorporate best practices and detailed
guidance from the core libraries and tools:

- **Vite (@vitejs/plugin-react, Vite Docs)**

  - Utilize Vite to benefit from its lightning-fast dev server, native ESM use, and powerful plugin architecture.
    Configure Vite with React support to ensure an efficient setup for rapid development and hot module replacement.
  - Reference: [Vite Features](https://vitejs.dev/guide/features)

- **jscodeshift**

  - Employ jscodeshift for AST-based codemods to normalize varied import/export patterns, ensuring consistency across
    your codebase.
  - Reference: [jscodeshift GitHub](https://github.com/facebook/jscodeshift)

- **React (Latest) & React Flow**

  - Adopt the latest React best practices by utilizing functional components and hooks. In conjunction with React Flow,
    build interactive and scalable graph visualizations.
  - References: [React Docs](https://reactjs.org/docs/getting-started.html) and
    [React Flow Learn](https://reactflow.dev)

- **DuckDB**

  - Integrate DuckDB using its Node.js API for caching and querying your dependency graph data. Leverage both in-memory
    and persistent database strategies to facilitate rapid prototyping and thorough analysis.
  - Reference: [DuckDB Node.js API](https://duckdb.org/docs/api/nodejs)

- **TypeScript**

  - Enforce strict typing and modern features to ensure code quality and maintainability. Enable strict mode and
    comprehensive type checking across your codebase.
  - Reference: [TypeScript Docs](https://www.typescriptlang.org/docs/)

- **commander**

  - Build a developer-friendly CLI using commander, with well-defined positional and optional arguments, enhanced error
    handling, and clear usage instructions.
  - Reference: [commander Docs](https://github.com/tj/commander.js)

- **Mermaid**

  - Use Mermaid for generating visual diagrams of the dependency graph to aid in debugging and visualization. Consider
    integration options such as typedoc-plugin-mermaid or remark-mermaidjs.
  - Reference: [Mermaid Docs](https://mermaid.js.org)

- **pnpm**
  - Manage monorepo dependencies efficiently with pnpm, taking advantage of its optimized node_modules structure and
    workspace capabilities.
  - Reference: [pnpm](https://pnpm.io)

This section ensures that developers have a clear, code-level understanding of how each tool contributes to the
project's success while providing direct links to further documentation for advanced usage or troubleshooting.

## Implementation Roadmap & Milestones

# Comprehensive Database and Code Review Plan

## I. Project Foundation

### 1. Project Setup

- [x] Create project with pnpm
- [x] Configure tsconfig.json for strict mode
- [x] Set up Vite with React
- [x] Create basic project structure:

### 2. Core Interfaces & Base Implementations

- [x] Implement core TypeScript interfaces and classes for:
  - Package, Module, Class, Interface
  - Method, Parameter, Property, Import
  - ClassImplements, InterfaceExtends, ClassExtends
- [x] Define and enforce type definitions to support deterministic UUID generation

---

## II. Existing Core Implementations

### 3. Parser Implementation

- [x] PackageParser:
  - Parses `package.json`, handles workspaces, and generates package UUIDs.
- [x] ModuleParser:
  - Parses TypeScript/JavaScript files, extracts imports/exports, and links modules to packages.
- [x] AST Parser:
  - Parses classes, interfaces, methods, and properties; handles inheritance and forward references.

### 4. Graph Implementation

- [x] Define node types for packages, modules, classes, interfaces, etc.
- [x] Implement graph operations for:
  - Adding/removing nodes and edges
  - Querying subgraphs and traversing relationships

### 5. Database Integration & Repositories

- [x] Establish DuckDB integration with native UUID support.
- [x] Initialize tables and relationships (see `src/db/schema.sql`).
- [x] Implement repositories for Package, Module, Class, Interface, Method, Parameter, Property, and Dependency.
- [ ] **Data Migration (Pending)**
  - [ ] Develop a script to export data from DuckDB to CSV.
  - [ ] Validate CSV data integrity with sample datasets.
  - [ ] Implement procedure for importing CSV data into Memgraph.
  - [ ] Document the migration process and verify data consistency post-migration.

### 6. CLI Implementation

- [x] Build a developer‐friendly CLI using commander (see `src/cli/index.ts`).
  - Implements commands such as analyze, export data, and start the visualization server.
- [x] Integrate error handling and progress indicators.

### 7. Frontend UI / Visualization

- [x] Implement the DependencyGraph component using ReactFlow (see `src/components/DependencyGraph.tsx`).
- [ ] **UI Refinements (Pending)**
  - [ ] Plan additional interactive features (filters, advanced visualizations, responsiveness).

### 8. UUID Generation Utility

- [x] Implement deterministic UUID generation using uuid v5 (see `src/utils/uuid.ts`).

### 9. Testing & Documentation

- [x] Basic test coverage exists (e.g., PackageParser tests).
- [ ] **Enhance Testing (Pending)**
  - [ ] Augment unit tests and integration tests for parsers, graph operations, and database interactions.
  - [ ] Develop performance tests for stress scenarios.
- [x] **Documentation Updates (Pending)**
  - [x] Revise `overview.md`, `types.md`, and `README.md` with the latest context and changes.
  - [x] Maintain a changelog for recent updates.

---

## III. Future Enhancements & Optimizations

### 10. Data Model & Schema Updates

- [ ] Review identifier fields to ensure all TypeScript interfaces use `id` instead of `uuid` where applicable.
- [ ] Add and validate denormalized fields for relationships:
  - Module should include `package_id`.
  - Class/Interface should include `module_id` and `package_id`.
  - Method should include `module_id`, `package_id`, and polymorphic `parent_id`.
  - Parameter and Property updates as needed.
- [ ] Update foreign key constraints and indexing strategies.

### 11. Parser, Graph, and ReactFlow Enhancements

- [ ] Enhance ModuleParser to fully support the new denormalized fields.
- [ ] Improve AST Parser for handling polymorphic relationships with two-pass parsing for forward references.
- [ ] Upgrade Graph Implementation:
  - [ ] Add bidirectional traversal and cycle detection.
  - [ ] Consider lazy loading and graph diffing capabilities.
- [ ] Refine ReactFlow integration:
  - [ ] Add collapsible subgraphs and custom edge routing.
  - [ ] Implement zoom-dependent detail levels and efficient filtering.

### 12. Performance Optimization

- [ ] Benchmark system performance with simulated large codebases.
- [ ] Identify and optimize bottlenecks in database queries and UI rendering.
- [ ] Implement:
  - [ ] Batch processing and incremental parsing.
  - [ ] Virtual scrolling for large graphs.
  - [ ] Optimized indexing and query structure.
- [ ] Develop and execute stress tests for memory usage and responsiveness.

### 13. Error Handling and Recovery Enhancements

- [ ] Enhance transaction rollback and automatic retry logic across database operations.
- [ ] Improve error logging and implement partial success handling.

### 14. Refactor and Consolidate Future Enhancements

- [ ] Evaluate the current UUID generation approach for alignment with updated ID conventions.
- [ ] Merge any redundant future enhancement tasks into a coherent plan for maintenance.

---

_This comprehensive plan reflects our progress to date and establishes a robust framework for further development in our
dependency graph tool._
