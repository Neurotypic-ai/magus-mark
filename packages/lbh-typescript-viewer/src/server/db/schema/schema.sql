-- Database Schema for TypeScript Codebase Analyzer using DuckDB native UUIDs
-- All tables use UUID for primary keys and proper foreign key references.
-- Timestamps are stored as TIMESTAMP and default to CURRENT_TIMESTAMP.
-- Note: DuckDB does not support ON DELETE CASCADE or triggers.
-- Packages table
CREATE TABLE packages (
  id CHAR(36) PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  path TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

-- Package Dependencies table (handles dependency relationships between packages)
CREATE TABLE package_dependencies (
  id CHAR(36) PRIMARY KEY,
  package_id CHAR(36) NOT NULL REFERENCES packages (id),
  dependency_id CHAR(36) NOT NULL REFERENCES packages (id),
  dependency_type TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  UNIQUE (package_id, dependency_id, dependency_type),
  CHECK (package_id != dependency_id),
  CHECK (
    dependency_type IN ('dependency', 'devDependency', 'peerDependency')
  )
);

-- Modules table with enhanced file location tracking
CREATE TABLE modules (
  id CHAR(36) PRIMARY KEY,
  package_id CHAR(36) NOT NULL REFERENCES packages (id),
  name TEXT NOT NULL,
  directory TEXT NOT NULL,
  filename TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  is_barrel BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

-- Create indices for faster module lookups
CREATE INDEX idx_modules_package_id ON modules (package_id);

CREATE INDEX idx_modules_filename ON modules (filename);

-- Module Tests table to track test files
CREATE TABLE module_tests (
  id CHAR(36) PRIMARY KEY,
  module_id CHAR(36) NOT NULL REFERENCES modules (id),
  test_path TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

-- Classes table with denormalized package_id and module_id
CREATE TABLE classes (
  id CHAR(36) PRIMARY KEY,
  package_id CHAR(36) NOT NULL REFERENCES packages (id),
  module_id CHAR(36) NOT NULL REFERENCES modules (id),
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

-- Interfaces table with denormalized package_id and module_id
CREATE TABLE interfaces (
  id CHAR(36) PRIMARY KEY,
  package_id CHAR(36) NOT NULL REFERENCES packages (id),
  module_id CHAR(36) NOT NULL REFERENCES modules (id),
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

-- Methods table with denormalized package_id, module_id, and polymorphic parent_id
CREATE TABLE methods (
  id CHAR(36) PRIMARY KEY,
  package_id CHAR(36) NOT NULL REFERENCES packages (id),
  module_id CHAR(36) NOT NULL REFERENCES modules (id),
  parent_id CHAR(36) NOT NULL,
  parent_type TEXT NOT NULL CHECK (parent_type IN ('class', 'interface')),
  name TEXT NOT NULL,
  return_type TEXT,
  is_static BOOLEAN NOT NULL DEFAULT FALSE,
  is_async BOOLEAN NOT NULL DEFAULT FALSE,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'protected')),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

-- Parameters table with denormalized package_id and module_id
CREATE TABLE parameters (
  id CHAR(36) PRIMARY KEY,
  package_id CHAR(36) NOT NULL REFERENCES packages (id),
  module_id CHAR(36) NOT NULL REFERENCES modules (id),
  method_id CHAR(36) NOT NULL REFERENCES methods (id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_optional BOOLEAN NOT NULL DEFAULT FALSE,
  is_rest BOOLEAN NOT NULL DEFAULT FALSE,
  default_value TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

-- Properties table with denormalized package_id, module_id, and polymorphic parent_id
CREATE TABLE properties (
  id CHAR(36) PRIMARY KEY,
  package_id CHAR(36) NOT NULL REFERENCES packages (id),
  module_id CHAR(36) NOT NULL REFERENCES modules (id),
  parent_id CHAR(36) NOT NULL,
  parent_type TEXT NOT NULL CHECK (parent_type IN ('class', 'interface')),
  name TEXT NOT NULL,
  type TEXT,
  is_static BOOLEAN NOT NULL DEFAULT FALSE,
  is_readonly BOOLEAN NOT NULL DEFAULT FALSE,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'protected')),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

-- Imports table with denormalized package_id and module_id
CREATE TABLE imports (
  id CHAR(36) PRIMARY KEY,
  package_id CHAR(36) NOT NULL REFERENCES packages (id),
  module_id CHAR(36) NOT NULL REFERENCES modules (id),
  source TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

-- Class implements table (many-to-many relationship)
CREATE TABLE class_implements (
  id CHAR(36) PRIMARY KEY,
  class_id CHAR(36) NOT NULL REFERENCES classes (id),
  interface_id CHAR(36) NOT NULL REFERENCES interfaces (id),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  UNIQUE (class_id, interface_id)
);

-- Interface extends table (many-to-many relationship)
CREATE TABLE interface_extends (
  id CHAR(36) PRIMARY KEY,
  interface_id CHAR(36) NOT NULL REFERENCES interfaces (id),
  extended_id CHAR(36) NOT NULL REFERENCES interfaces (id),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  UNIQUE (interface_id, extended_id),
  CHECK (interface_id != extended_id)
);

-- Class extends table (single inheritance)
CREATE TABLE class_extends (
  id CHAR(36) PRIMARY KEY,
  class_id CHAR(36) NOT NULL REFERENCES classes (id),
  parent_id CHAR(36) NOT NULL REFERENCES classes (id),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  UNIQUE (class_id),
  CHECK (class_id != parent_id)
);

-- Triggers and additional polymorphic relationship validations removed for DuckDB (triggers are not supported)
