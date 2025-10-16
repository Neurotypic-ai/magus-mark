import { describe, expect, it } from 'vitest';

import {
  generateClassUUID,
  generateEnumUUID,
  generateExportUUID,
  generateImportUUID,
  generateInterfaceUUID,
  generateMethodUUID,
  generateModuleUUID,
  generatePackageUUID,
  generateParameterUUID,
  generatePropertyUUID,
  generateTypeAliasUUID,
  generateUUID,
} from './uuid';

describe('UUID Generation', () => {
  describe('generateUUID', () => {
    it('should generate deterministic UUIDs', () => {
      const uuid1 = generateUUID('package', 'test-package@1.0.0');
      const uuid2 = generateUUID('package', 'test-package@1.0.0');

      expect(uuid1).toBe(uuid2);
      expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should generate different UUIDs for different keys', () => {
      const uuid1 = generateUUID('package', 'test-package@1.0.0');
      const uuid2 = generateUUID('package', 'test-package@2.0.0');

      expect(uuid1).not.toBe(uuid2);
    });

    it('should generate different UUIDs for different types', () => {
      const uuid1 = generateUUID('package', 'test');
      const uuid2 = generateUUID('module', 'test');

      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('Entity-specific UUID generators', () => {
    it('should generate package UUID from name and version', () => {
      const uuid = generatePackageUUID('my-package', '1.0.0');
      expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should generate module UUID from package and path', () => {
      const packageId = generatePackageUUID('my-package', '1.0.0');
      const uuid = generateModuleUUID(packageId, 'src/index.ts');
      expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should generate class UUID', () => {
      const packageId = generatePackageUUID('my-package', '1.0.0');
      const moduleId = generateModuleUUID(packageId, 'src/index.ts');
      const uuid = generateClassUUID(packageId, moduleId, 'MyClass');
      expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should generate interface UUID', () => {
      const packageId = generatePackageUUID('my-package', '1.0.0');
      const moduleId = generateModuleUUID(packageId, 'src/index.ts');
      const uuid = generateInterfaceUUID(packageId, moduleId, 'IMyInterface');
      expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should generate method UUID', () => {
      const uuid = generateMethodUUID('pkg-id', 'mod-id', 'parent-id', 'myMethod');
      expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should generate property UUID', () => {
      const uuid = generatePropertyUUID('pkg-id', 'mod-id', 'parent-id', 'myProperty', 'class');
      expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should generate parameter UUID', () => {
      const uuid = generateParameterUUID('method-id', 'paramName');
      expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should generate enum UUID', () => {
      const uuid = generateEnumUUID('pkg-id', 'mod-id', 'MyEnum');
      expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should generate export UUID', () => {
      const uuid = generateExportUUID('module-id', 'exportName');
      expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should generate import UUID', () => {
      const uuid = generateImportUUID('module-id', 'importName');
      expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should generate type alias UUID', () => {
      const uuid = generateTypeAliasUUID('module-id', 'MyType');
      expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  describe('UUID consistency', () => {
    it('should maintain consistency across multiple calls', () => {
      const packageId = generatePackageUUID('test-pkg', '1.0.0');
      const moduleId = generateModuleUUID(packageId, 'src/index.ts');
      const classId = generateClassUUID(packageId, moduleId, 'TestClass');
      const methodId = generateMethodUUID(packageId, moduleId, classId, 'testMethod');

      // Regenerate with same inputs
      const packageId2 = generatePackageUUID('test-pkg', '1.0.0');
      const moduleId2 = generateModuleUUID(packageId2, 'src/index.ts');
      const classId2 = generateClassUUID(packageId2, moduleId2, 'TestClass');
      const methodId2 = generateMethodUUID(packageId2, moduleId2, classId2, 'testMethod');

      expect(packageId).toBe(packageId2);
      expect(moduleId).toBe(moduleId2);
      expect(classId).toBe(classId2);
      expect(methodId).toBe(methodId2);
    });
  });
});
