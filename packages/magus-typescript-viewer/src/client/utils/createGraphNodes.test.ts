import { describe, expect, it } from 'vitest';

import { createGraphNodes } from './createGraphNodes';

import type { DependencyPackageGraph } from '../components/DependencyGraph/types';

describe('createGraphNodes', () => {
  it('should create package nodes from graph data', () => {
    const data: DependencyPackageGraph = {
      packages: [
        {
          id: 'pkg-1',
          name: 'test-package',
          version: '1.0.0',
          path: '/test/path',
          created_at: '2024-01-01T00:00:00.000Z',
        },
      ],
    };

    const nodes = createGraphNodes(data);

    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      id: 'pkg-1',
      type: 'package',
      data: {
        label: 'test-package',
        properties: [{ name: 'version', type: '1.0.0', visibility: 'public' }],
      },
    });
  });

  it('should create module nodes for each package', () => {
    const data: DependencyPackageGraph = {
      packages: [
        {
          id: 'pkg-1',
          name: 'test-package',
          version: '1.0.0',
          path: '/test/path',
          created_at: '2024-01-01T00:00:00.000Z',
          modules: {
            'mod-1': {
              id: 'mod-1',
              name: 'index',
              package_id: 'pkg-1',
              source: {
                relativePath: 'src/index.ts',
              },
            },
          },
        },
      ],
    };

    const nodes = createGraphNodes(data);

    expect(nodes).toHaveLength(2); // 1 package + 1 module
    const moduleNode = nodes.find((n) => n.type === 'module');
    expect(moduleNode).toMatchObject({
      id: 'mod-1',
      type: 'module',
      data: {
        parentId: 'pkg-1',
        label: 'index',
      },
    });
  });

  it('should create class nodes within modules', () => {
    const data: DependencyPackageGraph = {
      packages: [
        {
          id: 'pkg-1',
          name: 'test-package',
          version: '1.0.0',
          path: '/test/path',
          created_at: '2024-01-01T00:00:00.000Z',
          modules: {
            'mod-1': {
              id: 'mod-1',
              name: 'index',
              package_id: 'pkg-1',
              source: {
                relativePath: 'src/index.ts',
              },
              classes: {
                'cls-1': {
                  id: 'cls-1',
                  name: 'TestClass',
                  properties: [{ name: 'prop1', type: 'string', visibility: 'public' }],
                  methods: [{ name: 'method1', returnType: 'void', visibility: 'public', signature: '' }],
                },
              },
            },
          },
        },
      ],
    };

    const nodes = createGraphNodes(data);

    expect(nodes).toHaveLength(3); // 1 package + 1 module + 1 class
    const classNode = nodes.find((n) => n.type === 'class');
    expect(classNode).toMatchObject({
      id: 'cls-1',
      type: 'class',
      data: {
        parentId: 'mod-1',
        label: 'TestClass',
      },
    });
    expect(classNode?.data.properties).toHaveLength(1);
    expect(classNode?.data.methods).toHaveLength(1);
  });

  it('should create interface nodes within modules', () => {
    const data: DependencyPackageGraph = {
      packages: [
        {
          id: 'pkg-1',
          name: 'test-package',
          version: '1.0.0',
          path: '/test/path',
          created_at: '2024-01-01T00:00:00.000Z',
          modules: {
            'mod-1': {
              id: 'mod-1',
              name: 'index',
              package_id: 'pkg-1',
              source: {
                relativePath: 'src/index.ts',
              },
              interfaces: {
                'int-1': {
                  id: 'int-1',
                  name: 'ITestInterface',
                  properties: [],
                  methods: [],
                },
              },
            },
          },
        },
      ],
    };

    const nodes = createGraphNodes(data);

    expect(nodes).toHaveLength(3); // 1 package + 1 module + 1 interface
    const interfaceNode = nodes.find((n) => n.type === 'interface');
    expect(interfaceNode).toMatchObject({
      id: 'int-1',
      type: 'interface',
      data: {
        parentId: 'mod-1',
        label: 'ITestInterface',
      },
    });
  });

  it('should handle empty package data', () => {
    const data: DependencyPackageGraph = {
      packages: [],
    };

    const nodes = createGraphNodes(data);

    expect(nodes).toEqual([]);
  });
});
