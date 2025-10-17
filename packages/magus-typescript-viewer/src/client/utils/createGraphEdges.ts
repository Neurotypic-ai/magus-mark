import { MarkerType } from '@vue-flow/core';

import { mapTypeCollection } from '../components/DependencyGraph/mapTypeCollection';
import { getEdgeStyle } from '../theme/graphTheme';

import type { DependencyEdgeKind, DependencyPackageGraph, GraphEdge } from '../components/DependencyGraph/types';

/**
 * Creates graph edges from the provided dependency package graph data
 * @param data The dependency package graph data
 * @returns Array of edges for the dependency graph
 */
export function createGraphEdges(data: DependencyPackageGraph): GraphEdge[] {
  // Create edges from package dependencies
  return data.packages.flatMap((pkg) => {
    const edges: GraphEdge[] = [];

    // Handle regular dependencies
    if (pkg.dependencies) {
      mapTypeCollection(pkg.dependencies, (dep) => {
        if (!dep.id) return;

        edges.push({
          id: `${pkg.id}-${dep.id}-dependency`,
          source: pkg.id,
          target: dep.id,
          data: {
            type: 'dependency' as DependencyEdgeKind,
          },
          style: getEdgeStyle('dependency'),
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
        });
      });
    }

    // Handle dev dependencies
    if (pkg.devDependencies) {
      mapTypeCollection(pkg.devDependencies, (dep) => {
        if (!dep.id) return;

        edges.push({
          id: `${pkg.id}-${dep.id}-devDependency`,
          source: pkg.id,
          target: dep.id,
          data: {
            type: 'devDependency' as DependencyEdgeKind,
          },
          style: getEdgeStyle('devDependency'),
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
        });
      });
    }

    // Handle peer dependencies
    if (pkg.peerDependencies) {
      mapTypeCollection(pkg.peerDependencies, (dep) => {
        if (!dep.id) return;

        edges.push({
          id: `${pkg.id}-${dep.id}-peerDependency`,
          source: pkg.id,
          target: dep.id,
          data: {
            type: 'peerDependency' as DependencyEdgeKind,
          },
          style: getEdgeStyle('peerDependency'),
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
        });
      });
    }

    // Handle module dependencies
    if (pkg.modules) {
      mapTypeCollection(pkg.modules, (module) => {
        // Add parent-child edge from package to module
        edges.push({
          id: `${pkg.id}-${module.id}-contains`,
          source: pkg.id,
          target: module.id,
          data: {
            type: 'contains' as DependencyEdgeKind,
          },
          style: {
            ...getEdgeStyle('dependency'),
            strokeDasharray: '5,5',
            opacity: 0.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
          },
        });

        // Add module imports
        if (module.imports) {
          mapTypeCollection(module.imports, (imp) => {
            if (!imp.uuid) return;

            edges.push({
              id: `${module.id}-${imp.uuid}-import`,
              source: module.id,
              target: imp.uuid,
              data: {
                type: 'import' as DependencyEdgeKind,
              },
              style: getEdgeStyle('import'),
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
              },
            });
          });
        }

        // Add class inheritance and implementation edges
        if (module.classes) {
          mapTypeCollection(module.classes, (cls) => {
            // Add parent-child edge from module to class
            edges.push({
              id: `${module.id}-${cls.id}-contains`,
              source: module.id,
              target: cls.id,
              data: {
                type: 'contains' as DependencyEdgeKind,
              },
              style: {
                ...getEdgeStyle('dependency'),
                strokeDasharray: '5,5',
                opacity: 0.4,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 12,
                height: 12,
              },
            });

            // Handle class inheritance
            if (cls.extends_id) {
              edges.push({
                id: `${cls.id}-${cls.extends_id}-inheritance`,
                source: cls.id,
                target: cls.extends_id,
                data: {
                  type: 'inheritance' as DependencyEdgeKind,
                },
                style: getEdgeStyle('inheritance'),
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 20,
                  height: 20,
                },
              });
            }

            // Handle interface implementations
            if (cls.implemented_interfaces) {
              mapTypeCollection(cls.implemented_interfaces, (iface) => {
                if (!iface.id) return;

                edges.push({
                  id: `${cls.id}-${iface.id}-implements`,
                  source: cls.id,
                  target: iface.id,
                  data: {
                    type: 'implements' as DependencyEdgeKind,
                  },
                  style: getEdgeStyle('implements'),
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                  },
                });
              });
            }
          });
        }

        // Add interface inheritance edges
        if (module.interfaces) {
          mapTypeCollection(module.interfaces, (iface) => {
            // Add parent-child edge from module to interface
            edges.push({
              id: `${module.id}-${iface.id}-contains`,
              source: module.id,
              target: iface.id,
              data: {
                type: 'contains' as DependencyEdgeKind,
              },
              style: {
                ...getEdgeStyle('dependency'),
                strokeDasharray: '5,5',
                opacity: 0.4,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 12,
                height: 12,
              },
            });

            if (iface.extended_interfaces) {
              mapTypeCollection(iface.extended_interfaces, (extended) => {
                if (!extended.id) return;

                edges.push({
                  id: `${iface.id}-${extended.id}-inheritance`,
                  source: iface.id,
                  target: extended.id,
                  data: {
                    type: 'inheritance' as DependencyEdgeKind,
                  },
                  style: getEdgeStyle('inheritance'),
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                  },
                });
              });
            }
          });
        }
      });
    }

    return edges;
  });
}
