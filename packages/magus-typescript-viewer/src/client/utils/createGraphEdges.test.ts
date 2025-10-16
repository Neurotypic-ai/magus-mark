import { describe, expect, it } from 'vitest';

import { createGraphEdges } from './createGraphEdges';

import type { DependencyPackageGraph } from '../components/DependencyGraph/types';

describe('createGraphEdges', () => {
  it('should create dependency edges between packages', () => {
    const data: DependencyPackageGraph = {
      packages: [
        {
          id: 'pkg-1',
          name: 'package-a',
          version: '1.0.0',
          path: '/test/a',
          created_at: '2024-01-01T00:00:00.000Z',
          dependencies: {
            'dep-1': {
              id: 'pkg-2',
              name: 'package-b',
              version: '2.0.0',
            },
          },
        },
      ],
    };

    const edges = createGraphEdges(data);

    expect(edges.length).toBeGreaterThan(0);
    const depEdge = edges.find((e) => e.type === 'dependency');
    expect(depEdge).toMatchObject({
      source: 'pkg-1',
      target: 'pkg-2',
      type: 'dependency',
    });
  });

  it('should create devDependency edges', () => {
    const data: DependencyPackageGraph = {
      packages: [
        {
          id: 'pkg-1',
          name: 'package-a',
          version: '1.0.0',
          path: '/test/a',
          created_at: '2024-01-01T00:00:00.000Z',
          devDependencies: {
            'dep-1': {
              id: 'pkg-2',
              name: 'package-b',
              version: '2.0.0',
            },
          },
        },
      ],
    };

    const edges = createGraphEdges(data);

    const devDepEdge = edges.find((e) => e.type === 'devDependency');
    expect(devDepEdge).toMatchObject({
      source: 'pkg-1',
      target: 'pkg-2',
      type: 'devDependency',
    });
  });

  it('should create peerDependency edges', () => {
    const data: DependencyPackageGraph = {
      packages: [
        {
          id: 'pkg-1',
          name: 'package-a',
          version: '1.0.0',
          path: '/test/a',
          created_at: '2024-01-01T00:00:00.000Z',
          peerDependencies: {
            'dep-1': {
              id: 'pkg-2',
              name: 'package-b',
              version: '2.0.0',
            },
          },
        },
      ],
    };

    const edges = createGraphEdges(data);

    const peerDepEdge = edges.find((e) => e.type === 'peerDependency');
    expect(peerDepEdge).toMatchObject({
      source: 'pkg-1',
      target: 'pkg-2',
      type: 'peerDependency',
    });
  });

  it('should create import edges for modules', () => {
    const data: DependencyPackageGraph = {
      packages: [
        {
          id: 'pkg-1',
          name: 'package-a',
          version: '1.0.0',
          path: '/test/a',
          created_at: '2024-01-01T00:00:00.000Z',
          modules: {
            'mod-1': {
              id: 'mod-1',
              name: 'index',
              package_id: 'pkg-1',
              source: {
                relativePath: 'src/index.ts',
              },
              imports: {
                'imp-1': {
                  uuid: 'imp-1',
                  name: 'ImportedModule',
                },
              },
            },
          },
        },
      ],
    };

    const edges = createGraphEdges(data);

    const importEdge = edges.find((e) => e.type === 'import');
    expect(importEdge).toMatchObject({
      source: 'mod-1',
      target: 'imp-1',
      type: 'import',
    });
  });

  it('should create inheritance edges for classes', () => {
    const data: DependencyPackageGraph = {
      packages: [
        {
          id: 'pkg-1',
          name: 'package-a',
          version: '1.0.0',
          path: '/test/a',
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
                  name: 'ChildClass',
                  extends_id: 'cls-2',
                },
              },
            },
          },
        },
      ],
    };

    const edges = createGraphEdges(data);

    const inheritanceEdge = edges.find((e) => e.type === 'inheritance');
    expect(inheritanceEdge).toMatchObject({
      source: 'cls-1',
      target: 'cls-2',
      type: 'inheritance',
    });
  });

  it('should create implements edges for classes', () => {
    const data: DependencyPackageGraph = {
      packages: [
        {
          id: 'pkg-1',
          name: 'package-a',
          version: '1.0.0',
          path: '/test/a',
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
                  name: 'MyClass',
                  implemented_interfaces: {
                    'int-1': {
                      id: 'int-1',
                      name: 'IMyInterface',
                    },
                  },
                },
              },
            },
          },
        },
      ],
    };

    const edges = createGraphEdges(data);

    const implementsEdge = edges.find((e) => e.type === 'implements');
    expect(implementsEdge).toMatchObject({
      source: 'cls-1',
      target: 'int-1',
      type: 'implements',
    });
  });

  it('should handle empty package data', () => {
    const data: DependencyPackageGraph = {
      packages: [],
    };

    const edges = createGraphEdges(data);

    expect(edges).toEqual([]);
  });
});
