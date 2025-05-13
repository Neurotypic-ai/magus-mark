import { access, readFile } from 'fs/promises';
import { createRequire } from 'module';
import { dirname, join, relative } from 'path';

import { Import, ImportSpecifier } from '../../shared/types/Import';
import { createLogger } from '../../shared/utils/logger';
import {
  generateClassUUID,
  generateImportUUID,
  generateInterfaceUUID,
  generateMethodUUID,
  generateModuleUUID,
  generateParameterUUID,
  generatePropertyUUID,
} from '../utils/uuid';

import type {
  ASTNode,
  ASTPath,
  ClassDeclaration,
  ClassProperty,
  Collection,
  ExportNamedDeclaration,
  Identifier,
  ImportDeclaration,
  JSCodeshift,
  JSXIdentifier,
  MethodDefinition,
  TSInterfaceDeclaration,
  TSMethodSignature,
  TSPropertySignature,
  TSTypeAnnotation,
  TSTypeParameter,
} from 'jscodeshift';

import type { Export } from '../../shared/types/Export';
import type { FileLocation } from '../../shared/types/FileLocation';
import type { IClassCreateDTO } from '../db/repositories/ClassRepository';
import type { IInterfaceCreateDTO } from '../db/repositories/InterfaceRepository';
import type { IMethodCreateDTO } from '../db/repositories/MethodRepository';
import type { IModuleCreateDTO } from '../db/repositories/ModuleRepository';
import type { IParameterCreateDTO } from '../db/repositories/ParameterRepository';
import type { IPropertyCreateDTO } from '../db/repositories/PropertyRepository';
import type { ParseResult } from './ParseResult';

const require = createRequire(import.meta.url);

export class ModuleParser {
  private j: JSCodeshift;
  private root: Collection | undefined;
  private imports = new Map<string, Import>();
  private exports = new Set<string>();
  private reExports = new Set<string>();
  private readonly logger;

  constructor(
    private readonly filePath: string,
    private readonly packageId: string
  ) {
    const j: JSCodeshift = require('jscodeshift') as JSCodeshift;
    this.j = j.withParser('tsx');
    this.root = undefined; // Will be initialized in parse()
    this.logger = createLogger('ModuleParser');
  }

  // Safely get identifier name to work around type issues
  private getIdentifierName(id: string | Identifier | JSXIdentifier | TSTypeParameter): string | null {
    if (!id) return null;
    if (typeof id === 'string') return id;

    // Use type safe way to access name property
    if ('name' in id && typeof id.name === 'string') {
      return id.name;
    }

    return null;
  }

  async parse(): Promise<ParseResult> {
    const moduleId = generateModuleUUID(this.packageId, this.filePath);
    const relativePath = relative(process.cwd(), this.filePath);

    try {
      const content = await readFile(this.filePath, 'utf-8');
      this.root = this.j(content);

      // Reset tracking collections
      this.imports.clear();
      this.exports.clear();
      this.reExports.clear();

      const result = {
        package: undefined,
        modules: [await this.createModuleDTO(moduleId, relativePath)],
        classes: [] as IClassCreateDTO[],
        interfaces: [] as IInterfaceCreateDTO[],
        methods: [] as IMethodCreateDTO[],
        properties: [] as IPropertyCreateDTO[],
        parameters: [] as IParameterCreateDTO[],
        imports: [] as Import[],
        exports: [] as Export[],
      };

      this.parseImportsAndExports();
      this.parseClasses(moduleId, result);
      this.parseInterfaces(moduleId, result);

      // // Add collected imports and exports to result
      // result.imports = Array.from(this.imports.keys()).map((importPath) => ({
      //   path: importPath,
      //   symbols: Array.from(this.imports.get(importPath) ?? []),
      // }));
      // result.exports = Array.from(this.exports).map((exportName) => ({
      //   name: exportName,
      //   isBarrel: this.isBarrelFile(),
      // }));

      return result;
    } catch (error) {
      console.warn(
        `Warning: Failed to process ${relativePath}:`,
        error instanceof Error ? error.message : String(error)
      );

      return {
        modules: [await this.createModuleDTO(moduleId, relativePath)],
        classes: [],
        interfaces: [],
        methods: [],
        properties: [],
        parameters: [],
        imports: [],
        exports: [],
      };
    }
  }

  private parseImportsAndExports(): void {
    if (!this.root) return;

    // Parse imports first
    this.root.find(this.j.ImportDeclaration).forEach((path: ASTPath<ImportDeclaration>) => {
      const importPath = path.node.source.value;
      if (typeof importPath !== 'string') return;

      const importSpecifiers = new Map<string, ImportSpecifier>();

      path.node.specifiers?.forEach((specifier) => {
        if (specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier') {
          const name = specifier.imported.name;
          const uuid = generateImportUUID(importPath, name);
          const importSpecifier = new ImportSpecifier(uuid, name, 'value', undefined, new Set(), new Set());
          importSpecifiers.set(name, importSpecifier);
        }
      });

      // Create the Import instance
      if (importSpecifiers.size > 0) {
        const uuid = generateImportUUID(importPath, Array.from(importSpecifiers.keys()).join(','));
        const imp = new Import(uuid, importPath, importPath, importPath, importSpecifiers);
        this.imports.set(importPath, imp);
      }
    });

    // Parse exports and track re-exports
    this.root.find(this.j.ExportNamedDeclaration).forEach((path: ASTPath<ExportNamedDeclaration>) => {
      // Handle re-exports (export { x } from 'module')
      if (path.node.source) {
        path.node.specifiers?.forEach((specifier) => {
          if (specifier.exported.type === 'Identifier') {
            this.reExports.add(specifier.exported.name);
            this.exports.add(specifier.exported.name);
          }
        });
      }
      // Handle local exports
      else if (path.node.declaration) {
        if (path.node.declaration.type === 'ClassDeclaration' && path.node.declaration.id) {
          const name = this.getIdentifierName(path.node.declaration.id);
          if (name) this.exports.add(name);
        } else if (path.node.declaration.type === 'VariableDeclaration') {
          path.node.declaration.declarations.forEach((decl) => {
            if ('id' in decl && decl.id.type === 'Identifier') {
              const name = this.getIdentifierName(decl.id);
              if (name) this.exports.add(name);
            }
          });
        } else if (path.node.declaration.type === 'FunctionDeclaration' && path.node.declaration.id) {
          const name = this.getIdentifierName(path.node.declaration.id);
          if (name) this.exports.add(name);
        }
      }
    });

    // Also handle export * from 'module'
    this.root.find(this.j.ExportAllDeclaration).forEach((path) => {
      if (typeof path.node.source.value === 'string') {
        // Mark this module as having re-exports
        this.reExports.add('*');
      }
    });
  }

  private isBarrelFile(): boolean {
    if (this.exports.size === 0) return false;

    // If we have a wildcard export, consider it a barrel
    if (this.reExports.has('*')) return true;

    // Calculate the ratio of re-exports to total exports
    const reExportRatio = this.reExports.size / this.exports.size;

    // Consider it a barrel if more than 80% of exports are re-exports
    return reExportRatio > 0.8;
  }

  private async createModuleDTO(moduleId: string, relativePath: string): Promise<IModuleCreateDTO> {
    const directory = dirname(this.filePath);
    const fullName = relativePath.split('/').pop() ?? '';
    const name = fullName.replace(/\.[^/.]+$/, '');

    // Check for index files
    let indexFile: string | undefined;
    try {
      const tsIndex = join(directory, 'index.ts');
      await access(tsIndex);
      indexFile = tsIndex;
    } catch {
      try {
        const tsxIndex = join(directory, 'index.tsx');
        await access(tsxIndex);
        indexFile = tsxIndex;
      } catch {
        // No index file found
      }
    }

    return {
      id: moduleId,
      package_id: this.packageId,
      name,
      source: {
        directory,
        name,
        filename: this.filePath,
        relativePath,
        index: indexFile,
        isBarrel: this.isBarrelFile(),
      } as FileLocation,
    };
  }

  private parseClasses(moduleId: string, result: ParseResult): void {
    if (!this.root) return;

    this.root.find(this.j.ClassDeclaration).forEach((path) => {
      const node = path.node;
      if (!node.id?.name) return;

      const className = this.getIdentifierName(node.id);
      if (!className) return;

      const classId = generateClassUUID(this.packageId, moduleId, className);
      const classDTO = this.createClassDTO(classId, moduleId, node);
      result.classes.push(classDTO);

      // Parse methods and properties and add them to result
      const methods = this.parseClassMethods(moduleId, classId, node, result);
      const properties = this.parseClassProperties(moduleId, classId, node);

      result.methods.push(...methods);
      result.properties.push(...properties);
    });
  }

  private createClassDTO(classId: string, moduleId: string, node: ClassDeclaration): IClassCreateDTO {
    if (!node.id || node.id.type !== 'Identifier') {
      throw new Error('Invalid class declaration: missing identifier');
    }

    return {
      id: classId,
      package_id: this.packageId,
      module_id: moduleId,
      name: node.id.name,
      extends_id: node.superClass?.type === 'Identifier' ? node.superClass.name : undefined,
    };
  }

  private parseInterfaces(moduleId: string, result: ParseResult): void {
    if (!this.root) return;
    this.root.find(this.j.TSInterfaceDeclaration).forEach((path) => {
      const node = path.node;
      if (node.id.type !== 'Identifier' || !node.id.name) return;

      const interfaceId = generateInterfaceUUID(this.packageId, moduleId, node.id.name);
      const interfaceDTO = this.createInterfaceDTO(interfaceId, moduleId, node);
      result.interfaces.push(interfaceDTO);

      // Parse methods and properties and add them to result
      const methods = this.parseInterfaceMethods(moduleId, interfaceId, node, result);
      const properties = this.parseInterfaceProperties(moduleId, interfaceId, node);

      result.methods.push(...methods);
      result.properties.push(...properties);
    });
  }

  private createInterfaceDTO(interfaceId: string, moduleId: string, node: TSInterfaceDeclaration): IInterfaceCreateDTO {
    return {
      id: interfaceId,
      package_id: this.packageId,
      module_id: moduleId,
      name: node.id.type === 'Identifier' ? node.id.name : '',
    };
  }

  private parseClassMethods(
    moduleId: string,
    classId: string,
    node: ClassDeclaration,
    result: ParseResult
  ): IMethodCreateDTO[] {
    try {
      return this.parseMethods(this.j(node), 'class', classId, moduleId, result);
    } catch (error: unknown) {
      this.logger.error(`Error parsing class methods: ${String(error)}`);
      return [];
    }
  }

  private parseInterfaceMethods(
    moduleId: string,
    interfaceId: string,
    node: TSInterfaceDeclaration,
    result: ParseResult
  ): IMethodCreateDTO[] {
    try {
      return this.parseMethods(this.j(node), 'interface', interfaceId, moduleId, result);
    } catch (error: unknown) {
      this.logger.error(`Error parsing interface methods: ${String(error)}`);
      return [];
    }
  }

  private parseMethods(
    collection: Collection,
    parentType: 'class' | 'interface',
    parentId: string,
    moduleId: string,
    result: ParseResult
  ): IMethodCreateDTO[] {
    const methods: IMethodCreateDTO[] = [];

    try {
      // Expand method node collection to include more patterns
      let methodNodes: Collection;

      if (parentType === 'class') {
        // Get method definitions
        const classMethods = collection.find(this.j.MethodDefinition);

        // Add class property arrow functions
        const propertyMethods = collection
          .find(this.j.ClassProperty)
          .filter((path: ASTPath<ClassProperty>): boolean => {
            const value = path.value.value;
            return Boolean(
              value && typeof value === 'object' && 'type' in value && value.type === 'ArrowFunctionExpression'
            );
          });

        // Combine both collections
        methodNodes = this.j([...classMethods.paths(), ...propertyMethods.paths()]);
      } else {
        // Interface methods
        methodNodes = collection.find(this.j.TSMethodSignature);
      }

      methodNodes.forEach((path) => {
        try {
          const node = path.value as MethodDefinition | TSMethodSignature;
          const methodName = this.getMethodName(node);

          if (!methodName) {
            this.logger.info('Skipping method with invalid name', {
              parentId,
              nodeType: node.type,
            });
            return;
          }

          const methodId = generateMethodUUID(this.packageId, moduleId, parentId, methodName);
          const returnType = this.getReturnType(node);

          // Parse parameters and store them in the result object
          const parameters = this.parseParameters(node, methodId, moduleId);

          // Add static detection with type guard
          const isStatic = parentType === 'class' && 'static' in node && node.static;

          // Add async detection with type guard
          const isAsync =
            parentType === 'class' &&
            'value' in node &&
            node.value.type === 'FunctionExpression' &&
            node.value.async === true;

          methods.push({
            id: methodId,
            name: methodName,
            package_id: this.packageId,
            module_id: moduleId,
            parent_id: parentId,
            parent_type: parentType,
            return_type: returnType,
            is_static: isStatic,
            is_async: isAsync,
            visibility: 'public', // Default visibility
          });

          // Add parameters to the result object
          if (parameters.length > 0) {
            result.parameters.push(...parameters);
          }
        } catch (error) {
          this.logger.error('Error parsing individual method:', { error, parentId });
        }
      });
    } catch (error) {
      this.logger.error('Error parsing methods:', { error, parentId });
    }

    return methods;
  }

  private parseClassProperties(moduleId: string, classId: string, node: ClassDeclaration): IPropertyCreateDTO[] {
    try {
      return this.parseProperties(moduleId, classId, 'class', node);
    } catch (error: unknown) {
      this.logger.error(`Error parsing class properties: ${String(error)}`);
      return [];
    }
  }

  private parseInterfaceProperties(
    moduleId: string,
    interfaceId: string,
    node: TSInterfaceDeclaration
  ): IPropertyCreateDTO[] {
    try {
      return this.parseProperties(moduleId, interfaceId, 'interface', node);
    } catch (error: unknown) {
      this.logger.error(`Error parsing interface properties: ${String(error)}`);
      return [];
    }
  }

  private parseProperties(
    moduleId: string,
    parentId: string,
    parentType: 'class' | 'interface',
    node: ClassDeclaration | TSInterfaceDeclaration
  ): IPropertyCreateDTO[] {
    const properties: IPropertyCreateDTO[] = [];
    const collection = this.j(node);
    const propertyNodes =
      parentType === 'class' ? collection.find(this.j.ClassProperty) : collection.find(this.j.TSPropertySignature);

    propertyNodes.forEach((path, index) => {
      try {
        const propertyNode = path.node;
        const propertyName = this.getPropertyName(propertyNode);
        if (!propertyName) {
          this.logger.error('Invalid property name');
          return;
        }

        const propertyType = this.getTypeFromAnnotation(propertyNode.typeAnnotation as TSTypeAnnotation);
        // Generate a unique property ID using package, module, parent, property info, and position
        const propertyId = generatePropertyUUID(
          this.packageId,
          moduleId,
          parentId,
          `${propertyName}_${String(index)}`,
          parentType
        );

        properties.push({
          id: propertyId,
          module_id: moduleId,
          parent_id: parentId,
          parent_type: parentType,
          name: propertyName,
          type: propertyType,
          package_id: this.packageId,
          is_static: false,
          is_readonly: false,
          visibility: 'public',
        });
      } catch (error: unknown) {
        this.logger.error(`Error parsing property: ${String(error)}`);
      }
    });

    return properties;
  }

  private getMethodName(node: MethodDefinition | TSMethodSignature): string | undefined {
    try {
      return node.key.type === 'Identifier' ? node.key.name : undefined;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error getting method name:', { error: errorMessage });
      return undefined;
    }
  }

  private getPropertyName(node: ClassProperty | TSPropertySignature): string | undefined {
    try {
      if (node.key.type === 'Identifier') {
        return node.key.name;
      }
      return undefined;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error getting property name:', { error: errorMessage });
      return undefined;
    }
  }

  private parseParameters(
    node: MethodDefinition | TSMethodSignature,
    methodId: string,
    moduleId: string
  ): IParameterCreateDTO[] {
    const parameters: IParameterCreateDTO[] = [];

    try {
      const params = this.getParametersList(node);
      if (!Array.isArray(params)) {
        return parameters;
      }

      for (const param of params) {
        if (param.type !== 'Identifier') {
          continue;
        }

        const paramType = this.getTypeFromAnnotation(param.typeAnnotation as TSTypeAnnotation);
        const paramId = generateParameterUUID(methodId, param.name);

        parameters.push({
          id: paramId,
          name: param.name,
          type: paramType,
          package_id: this.packageId,
          module_id: moduleId,
          method_id: methodId,
          is_optional: false,
          is_rest: false,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error parsing parameters: ${errorMessage}`);
    }

    return parameters;
  }

  private getParametersList(node: MethodDefinition | TSMethodSignature): ASTNode[] {
    if ('value' in node) {
      return node.value.params;
    }
    if ('parameters' in node) {
      return node.parameters;
    }
    return [];
  }

  private getReturnType(node: MethodDefinition | TSMethodSignature): string {
    try {
      const returnTypeNode = this.getReturnTypeNode(node);
      return this.getTypeFromAnnotation(returnTypeNode) || 'void';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting return type: ${errorMessage}`);
      return 'void';
    }
  }

  private getReturnTypeNode(node: MethodDefinition | TSMethodSignature): TSTypeAnnotation | undefined {
    if ('value' in node && node.value.returnType) {
      return node.value.returnType as TSTypeAnnotation;
    }
    if ('typeAnnotation' in node && node.typeAnnotation) {
      return node.typeAnnotation as TSTypeAnnotation;
    }
    return undefined;
  }

  private getTypeFromAnnotation(annotation: TSTypeAnnotation | null | undefined): string {
    if (!annotation) {
      return 'any';
    }

    try {
      return (
        this.j(annotation)
          .toSource()
          .replace(/[\n\s]+/g, ' ')
          .trim() || 'any'
      );
    } catch (error: unknown) {
      this.logger.error('Error getting type from annotation:', { error: String(error) });
      return 'any';
    }
  }
}
