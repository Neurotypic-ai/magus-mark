import type { DuckDBValue } from '@duckdb/node-api';

export interface IDatabaseRow {
  id: string;
  [key: string]: DuckDBValue | undefined;
}

export interface IPackageRow extends IDatabaseRow {
  name: string;
  version: string;
  path: string;
  created_at: string; // ISO date string
}

export interface IPackageDependencyRow extends IDatabaseRow {
  package_id: string;
  dependency_id: string;
  dependency_type: 'dependency' | 'devDependency' | 'peerDependency';
  created_at: string;
}

export interface IModuleRow extends IDatabaseRow {
  package_id: string;
  name: string;
  path: string;
}

export interface IClassRow extends IDatabaseRow {
  module_id: string;
  name: string;
  extends_id?: string;
}

export interface IInterfaceRow extends IDatabaseRow {
  module_id: string;
  name: string;
}

export interface IMethodRow extends IDatabaseRow {
  parent_id: string;
  parent_type: 'class' | 'interface';
  name: string;
  return_type: string;
  is_static: boolean;
  is_abstract: boolean;
  visibility: string;
}

export interface IPropertyRow extends IDatabaseRow {
  parent_id: string;
  parent_type: 'class' | 'interface';
  name: string;
  type: string;
  is_static: boolean;
  is_readonly: boolean;
  visibility: string;
}

export interface IDependencyRow extends IDatabaseRow {
  source_id: string;
  target_id: string;
  type: 'dependency' | 'devDependency' | 'peerDependency';
}

/**
 * Represents a row in the parameters table.
 */
export interface IParameterRow extends IDatabaseRow {
  /**
   * The unique identifier for the parameter.
   */
  id: string;

  /**
   * The UUID of the parent package.
   */
  package_id: string;

  /**
   * The UUID of the parent module.
   */
  module_id: string;

  /**
   * The UUID of the parent method.
   */
  method_id: string;

  /**
   * The name of the parameter.
   */
  name: string;

  /**
   * The type of the parameter.
   */
  type: string;

  /**
   * Whether the parameter is optional.
   */
  is_optional: number;

  /**
   * Whether the parameter is a rest parameter.
   */
  is_rest: number;

  /**
   * The default value of the parameter, if any.
   */
  default_value: string | null;

  /**
   * The timestamp when the parameter was created.
   */
  created_at: string;
}
