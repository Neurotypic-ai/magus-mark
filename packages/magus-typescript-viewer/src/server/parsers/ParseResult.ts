import type { Export } from '../../shared/types/Export';
import type { Import } from '../../shared/types/Import';
import type { IClassCreateDTO } from '../db/repositories/ClassRepository';
import type { IFunctionCreateDTO } from '../db/repositories/FunctionRepository';
import type { IImportSpecifierCreateDTO } from '../db/repositories/ImportSpecifierRepository';
import type { IInterfaceCreateDTO } from '../db/repositories/InterfaceRepository';
import type { IMethodCreateDTO } from '../db/repositories/MethodRepository';
import type { IModuleCreateDTO } from '../db/repositories/ModuleRepository';
import type { IPackageCreateDTO } from '../db/repositories/PackageRepository';
import type { IParameterCreateDTO } from '../db/repositories/ParameterRepository';
import type { IPropertyCreateDTO } from '../db/repositories/PropertyRepository';

export interface ParseResult {
  package?: IPackageCreateDTO | undefined;
  modules: IModuleCreateDTO[];
  classes: IClassCreateDTO[];
  interfaces: IInterfaceCreateDTO[];
  functions: IFunctionCreateDTO[];
  methods: IMethodCreateDTO[];
  properties: IPropertyCreateDTO[];
  parameters: IParameterCreateDTO[];
  imports: Import[];
  exports: Export[];
  importsWithModules?: { import: Import; moduleId: string }[];
  importSpecifiers: IImportSpecifierCreateDTO[];
  /**
   * Class implements relationships captured during parsing, keyed by class id and listing interface names.
   * Interface names are resolved to IDs during the analyze step after all interfaces are saved.
   */
  classImplements?: { classId: string; interfaceNames: string[] }[];
  /**
   * Interface extends relationships captured during parsing, keyed by interface id and listing extended interface names.
   * Interface names are resolved to IDs during the analyze step after all interfaces are saved.
   */
  interfaceExtends?: { interfaceId: string; extendedNames: string[] }[];
}
