Below is a large comparison table for various TypeScript symbol types, showing a variety of columns you might include.
**No code samples** are used—just plain text descriptions.

| **Symbol**     | **Category**                            | **Declaration Keywords**          | **Basic Syntax Example**                            | **Description**                                                                                      | **Exportable?**   | **Overloadable?**                           | **Generic Support?**               | **Inheritance / Extensibility**                                  | **Visibility Modifiers?**    | **Scope**        | **Mergable?**                                     | **Compiles to JS?**                | **Typical Use Cases**                                                   | **Additional Notes**                                                                               |
| -------------- | --------------------------------------- | --------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------- | ---------------------------- | ---------------- | ------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **import**     | Module System (TypeScript + JavaScript) | `import`                          | Example: import something from "somewhere"          | Used to bring external modules, values, or types into the current file or module.                    | Top-level only    | Not applicable                              | Not applicable                     | Not applicable                                                   | Not applicable               | Module-level     | No (cannot merge)                                 | Yes (transpiles to import/require) | Bringing in external code or types.                                     | Must be at top-level in ES Modules. In older systems, transforms to `require` calls.               |
| **export**     | Module System (TypeScript + JavaScript) | `export`, `export default`        | Example: export const x = 1                         | Makes symbols publicly available to be imported in other files.                                      | Yes               | Not applicable                              | Not applicable                     | Not applicable                                                   | Not applicable               | Module-level     | No                                                | Yes (transpiles to exports)        | Sharing variables, functions, classes, etc. with other modules.         | Supports named exports and a single default export per file.                                       |
| **function**   | Value-level + optional type-level info  | `function`, `export function`     | Example: function greet(name: string): string {...} | Defines a reusable code block; can include parameter and return-type annotations.                    | Yes (with export) | Yes (function overloads)                    | Yes (generic functions)            | Not typically extended, but can be combined with interface types | Public by default in modules | Module or block  | No (doesn't merge like interfaces)                | Yes (regular JavaScript function)  | Creating reusable logic with typed parameters and return types.         | Can also be declared via variable expressions, supports optional/default parameters and generics.  |
| **class**      | Value-level + type-level                | `class`, `export class`           | Example: class MyClass { constructor(...) {...} }   | Object-oriented construct with properties, methods, and optional access modifiers.                   | Yes (with export) | Not directly overloadable                   | Yes (class generics)               | Supports inheritance via extends, can implement interfaces       | public, private, protected   | Module or block  | No (class+interface can complement but not merge) | Yes (ES2015 classes)               | Encapsulating data and behavior, object-oriented patterns, inheritance. | Can implement multiple interfaces, can be abstract, supports static members.                       |
| **interface**  | Type-only                               | `interface`, `export interface`   | Example: interface MyType { property: string; }     | Describes the shape of an object, function, or class contract; erased at compile time.               | Yes (with export) | Not exactly overloads, but can be augmented | Yes (generic interfaces)           | Interfaces can extend other interfaces                           | Not applicable               | Type-only        | Yes (declaration merging)                         | No (type-level only)               | Defining object shapes, function signatures, class contracts, etc.      | Can be merged across multiple declarations; supports optional, readonly, and index signatures.     |
| **type alias** | Type-only                               | `type`, `export type`             | Example: type ID = string or number                 | Defines an alias for any TypeScript type (unions, intersections, primitives, etc.).                  | Yes (with export) | Not applicable                              | Yes (type aliases can be generic)  | Not applicable                                                   | Not applicable               | Type-only        | No (cannot merge like interfaces)                 | No (type-level only)               | Simplifying or naming complex types; unions and intersections.          | More flexible than interfaces for union or primitive types. Does not support declaration merging.  |
| **enum**       | Value-level + type-level                | `enum`, `export enum`             | Example: enum Direction {Up, Down}                  | Defines a named set of numeric or string constants, which compile to an object-like structure in JS. | Yes (with export) | Not applicable                              | Not supported directly in the enum | Not applicable                                                   | Not applicable               | Module-level     | No                                                | Yes (object with properties)       | Handling a limited set of related constants (e.g., states, directions). | Numeric and string-based enums are possible. Can have initialization issues if not used carefully. |
| **namespace**  | Module System (older TS pattern)        | `namespace` (previously `module`) | Example: namespace MySpace { export... }            | Groups related declarations under a named scope; older pattern largely superseded by ES modules.     | Yes (internally)  | Not applicable                              | Not really applicable              | Namespaces can nest or be split across files with the same name  | Not applicable               | Global or module | Yes (multiple namespace blocks can merge)         | Compiles to an IIFE or object      | Organizing code in large internal TS projects or older TS versions.     | Modern TS prefers ES modules. Declarations can be merged if they share the same namespace name.    |

### Column Explanations

- **Symbol**: Name of the TypeScript construct (class, function, interface, etc.).
- **Category**: Whether the symbol is purely type-level, value-level, or part of the module system.
- **Declaration Keywords**: The keywords used for declaration, including optional `export`.
- **Basic Syntax Example**: A short phrase describing how you might write it (without actual code blocks).
- **Description**: An explanation of the construct's purpose.
- **Exportable?**: Indicates if you can use `export` to make it available in other files.
- **Overloadable?**: Whether it can have multiple definitions under the same name with different signatures.
- **Generic Support?**: Whether the symbol supports TypeScript generics.
- **Inheritance / Extensibility**: Can it be inherited, extended, or implement something else?
- **Visibility Modifiers?**: Whether `public`, `private`, `protected`, etc., apply.
- **Scope**: Where the symbol lives (module-level, block-level, type-only, etc.).
- **Mergable?**: Whether multiple declarations can merge (interfaces and namespaces can).
- **Compiles to JS?**: Does it produce JavaScript output, or is it erased at compile time?
- **Typical Use Cases**: Common scenarios for using that symbol.
- **Additional Notes**: Miscellaneous info, edge cases, or special features.

# Data Model

## Data Model

+Note: As part of the Comprehensive Database and Code Review Plan, all entity identifiers have been renamed from 'uuid'
to 'id'. Static creation methods have been removed in favor of repository DTO-based instantiation and validation.
Additionally, denormalized fields (such as package_id, module_id, and parent_id) are now mandatory to enforce robust
relationships and data integrity.

## Database Adapter Types

### Core Interfaces

1. **IDatabaseConnection**

```typescript
interface IDatabaseConnection {
  query(sql: string, params?: unknown[]): Promise<unknown>;
  close(): Promise<void>;
}
```

2. **IDatabaseAdapter**

```typescript
interface IDatabaseAdapter {
  init(): Promise<void>;
  savePackage(pkg: Package): Promise<void>;
  saveModule(module: Module, packageId: string): Promise<void>;
  close(): Promise<void>;
  getConnection(): IDatabaseConnection;
  transaction<T>(callback: (conn: IDatabaseConnection) => Promise<T>): Promise<T>;
  getDbPath(): string;
}
```

### Abstract Base Class

```typescript
abstract class BaseAdapter implements IDatabaseAdapter {
  constructor(protected readonly dbPath: string = ':memory:') {}

  abstract init(): Promise<void>;
  abstract getConnection(): IDatabaseConnection;
  abstract close(): Promise<void>;

  // Implements shared functionality:
  async savePackage(pkg: Package): Promise<void>;
  async saveModule(module: Module, packageId: string): Promise<void>;
  async transaction<T>(callback: (conn: IDatabaseConnection) => Promise<T>): Promise<T>;
  getDbPath(): string;
}
```

### Implementations

1. **Database (DuckDB)**

```typescript
class Database extends BaseAdapter {
  private db: duckdb.Database;
  private conn: DuckDBConnection;

  // Implements required abstract methods
  async init(): Promise<void>;
  getConnection(): IDatabaseConnection;
  async close(): Promise<void>;
}
```

2. **DatabaseWasm (DuckDB-Wasm)**

```typescript
class DatabaseWasm extends BaseAdapter {
  private db: AsyncDuckDB;
  private conn: DuckDBWasmConnection;
  private options: DatabaseOptions;

  // Implements required abstract methods
  async init(): Promise<void>;
  getConnection(): IDatabaseConnection;
  async close(): Promise<void>;
}
```

## Core Types

### Package

Represents a package in the codebase (either local or from node_modules).

```typescript
interface IPackage {
  id: UUID; // Unique identifier (was 'uuid')
  name: string; // Package name
  version: string; // Package version
  path: string; // Path to package
  created_at: Date; // Creation timestamp
}
```

+// Note: Do not use static create methods; use repository DTOs for instantiation.

### Module

Represents a TypeScript/JavaScript module file.

```typescript
interface IModule {
  id: UUID; // Unique identifier (was 'uuid')
  package_id: UUID; // Reference to parent package
  name: string; // Module name
  path: string; // Path to module file
  created_at: Date; // Creation timestamp
}
```

### Class

Represents a class definition.

```typescript
interface IClass {
  id: UUID; // Unique identifier (was 'uuid')
  package_id: UUID; // Reference to containing package
  module_id: UUID; // Reference to containing module
  name: string; // Class name
  created_at: Date; // Creation timestamp
}
```

### Interface

Represents an interface definition.

```typescript
interface IInterface {
  id: UUID; // Unique identifier (was 'uuid')
  package_id: UUID; // Reference to containing package
  module_id: UUID; // Reference to containing module
  name: string; // Interface name
  created_at: Date; // Creation timestamp
}
```

### Method

Represents a method in a class or interface.

```typescript
interface IMethod {
  id: UUID; // Unique identifier (was 'uuid')
  package_id: UUID; // Reference to containing package
  module_id: UUID; // Reference to containing module
  parent_id: UUID; // Reference to containing class/interface
  name: string; // Method name
  return_type: string; // Return type
  created_at: Date; // Creation timestamp
}
```

### Parameter

Represents a parameter in a method.

```typescript
interface IParameter {
  id: UUID; // Unique identifier (was 'uuid')
  package_id: UUID; // Reference to containing package
  module_id: UUID; // Reference to containing module
  method_id: UUID; // Reference to containing method
  name: string; // Parameter name
  type: string; // Parameter type
  created_at: Date; // Creation timestamp
}
```

### Property

Represents a property in a class or interface.

```typescript
interface IProperty {
  id: UUID; // Unique identifier (was 'uuid')
  package_id: UUID; // Reference to containing package
  module_id: UUID; // Reference to containing module
  parent_id: UUID; // Reference to containing class/interface
  name: string; // Property name
  type: string; // Property type
  created_at: Date; // Creation timestamp
}
```

### Import

Base interface for imports.

```typescript
interface IImport {
  id: UUID; // Unique identifier (was 'uuid')
  package_id: UUID; // Reference to containing package
  module_id: UUID; // Reference to containing module
  source: string; // Import source
  created_at: Date; // Creation timestamp
}
```

## Linking Tables

### ClassImplements

Links classes to their implemented interfaces.

```typescript
interface IClassImplements {
  id: UUID; // Unique identifier
  class_id: UUID; // Reference to implementing class
  interface_id: UUID; // Reference to implemented interface
  created_at: Date; // Creation timestamp
}
```

### InterfaceExtends

Links interfaces to their extended interfaces.

```typescript
interface IInterfaceExtends {
  id: UUID; // Unique identifier
  interface_id: UUID; // Reference to extending interface
  extended_id: UUID; // Reference to extended interface
  created_at: Date; // Creation timestamp
}
```

### ClassExtends

Links classes to their parent classes.

```typescript
interface IClassExtends {
  id: UUID; // Unique identifier
  class_id: UUID; // Reference to child class
  parent_id: UUID; // Reference to parent class
  created_at: Date; // Creation timestamp
}
```

## Database Schema

### Tables

1. packages

   - id UUID PRIMARY KEY
   - name TEXT NOT NULL
   - version TEXT NOT NULL
   - path TEXT NOT NULL
   - created_at TIMESTAMP NOT NULL

2. modules

   - id UUID PRIMARY KEY
   - package_id UUID NOT NULL REFERENCES packages(id)
   - name TEXT NOT NULL
   - path TEXT NOT NULL
   - created_at TIMESTAMP NOT NULL

3. classes

   - id UUID PRIMARY KEY
   - package_id UUID NOT NULL REFERENCES packages(id)
   - module_id UUID NOT NULL REFERENCES modules(id)
   - name TEXT NOT NULL
   - created_at TIMESTAMP NOT NULL

4. interfaces

   - id UUID PRIMARY KEY
   - package_id UUID NOT NULL REFERENCES packages(id)
   - module_id UUID NOT NULL REFERENCES modules(id)
   - name TEXT NOT NULL
   - created_at TIMESTAMP NOT NULL

5. methods

   - id UUID PRIMARY KEY
   - package_id UUID NOT NULL REFERENCES packages(id)
   - module_id UUID NOT NULL REFERENCES modules(id)
   - parent_id UUID NOT NULL
   - name TEXT NOT NULL
   - return_type TEXT NOT NULL
   - created_at TIMESTAMP NOT NULL

6. parameters

   - id UUID PRIMARY KEY
   - package_id UUID NOT NULL REFERENCES packages(id)
   - module_id UUID NOT NULL REFERENCES modules(id)
   - method_id UUID NOT NULL REFERENCES methods(id)
   - name TEXT NOT NULL
   - type TEXT NOT NULL
   - created_at TIMESTAMP NOT NULL

7. properties

   - id UUID PRIMARY KEY
   - package_id UUID NOT NULL REFERENCES packages(id)
   - module_id UUID NOT NULL REFERENCES modules(id)
   - parent_id UUID NOT NULL
   - name TEXT NOT NULL
   - type TEXT NOT NULL
   - created_at TIMESTAMP NOT NULL

8. imports

   - id UUID PRIMARY KEY
   - package_id UUID NOT NULL REFERENCES packages(id)
   - module_id UUID NOT NULL REFERENCES modules(id)
   - source TEXT NOT NULL
   - created_at TIMESTAMP NOT NULL

9. class_implements

   - id UUID PRIMARY KEY
   - class_id UUID NOT NULL REFERENCES classes(id)
   - interface_id UUID NOT NULL REFERENCES interfaces(id)
   - created_at TIMESTAMP NOT NULL

10. interface_extends

    - id UUID PRIMARY KEY
    - interface_id UUID NOT NULL REFERENCES interfaces(id)
    - extended_id UUID NOT NULL REFERENCES interfaces(id)
    - created_at TIMESTAMP NOT NULL

11. class_extends
    - id UUID PRIMARY KEY
    - class_id UUID NOT NULL REFERENCES classes(id)
    - parent_id UUID NOT NULL REFERENCES classes(id)
    - created_at TIMESTAMP NOT NULL

### Indexes

1. packages

   - idx_packages_name ON name
   - idx_packages_path ON path

2. modules

   - idx_modules_package_id ON package_id
   - idx_modules_path ON path
   - idx_modules_name ON name

3. classes

   - idx_classes_package_id ON package_id
   - idx_classes_module_id ON module_id
   - idx_classes_name ON name

4. interfaces

   - idx_interfaces_package_id ON package_id
   - idx_interfaces_module_id ON module_id
   - idx_interfaces_name ON name

5. methods

   - idx_methods_package_id ON package_id
   - idx_methods_module_id ON module_id
   - idx_methods_parent_id ON parent_id
   - idx_methods_name ON name

6. parameters

   - idx_parameters_package_id ON package_id
   - idx_parameters_module_id ON module_id
   - idx_parameters_method_id ON method_id

7. properties

   - idx_properties_package_id ON package_id
   - idx_properties_module_id ON module_id
   - idx_properties_parent_id ON parent_id

8. imports

   - idx_imports_package_id ON package_id
   - idx_imports_module_id ON module_id
   - idx_imports_source ON source

9. class_implements

   - idx_class_implements_class_id ON class_id
   - idx_class_implements_interface_id ON interface_id

10. interface_extends

    - idx_interface_extends_interface_id ON interface_id
    - idx_interface_extends_extended_id ON extended_id

11. class_extends
    - idx_class_extends_class_id ON class_id
    - idx_class_extends_parent_id ON parent_id
