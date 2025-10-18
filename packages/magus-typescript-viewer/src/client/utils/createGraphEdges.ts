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

    // Add containment edges from package to modules
    if (pkg.modules && Object.keys(pkg.modules).length > 0) {
      mapTypeCollection(pkg.modules, (module) => {
        edges.push({
          id: `${pkg.id}-${module.id}-contains`,
          source: pkg.id,
          target: module.id,
          hidden: false,
          data: {
            type: 'contains' as DependencyEdgeKind,
          },
          style: {
            ...getEdgeStyle('contains'),
            strokeDasharray: '5,5', // Dashed line for containment
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
          },
        });
      });
    }

    // Handle regular dependencies
    if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
      mapTypeCollection(pkg.dependencies, (dep) => {
        if (!dep.id) return;

        edges.push({
          id: `${pkg.id}-${dep.id}-dependency`,
          source: pkg.id,
          target: dep.id,
          hidden: false,
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
    if (pkg.devDependencies && Object.keys(pkg.devDependencies).length > 0) {
      mapTypeCollection(pkg.devDependencies, (dep) => {
        if (!dep.id) return;

        edges.push({
          id: `${pkg.id}-${dep.id}-devDependency`,
          source: pkg.id,
          target: dep.id,
          hidden: false,
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
    if (pkg.peerDependencies && Object.keys(pkg.peerDependencies).length > 0) {
      mapTypeCollection(pkg.peerDependencies, (dep) => {
        if (!dep.id) return;

        edges.push({
          id: `${pkg.id}-${dep.id}-peerDependency`,
          source: pkg.id,
          target: dep.id,
          hidden: false,
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
    if (pkg.modules && Object.keys(pkg.modules).length > 0) {
      mapTypeCollection(pkg.modules, (module) => {
        // Add containment edges from module to classes
        if (module.classes && Object.keys(module.classes).length > 0) {
          mapTypeCollection(module.classes, (cls) => {
            edges.push({
              id: `${module.id}-${cls.id}-contains`,
              source: module.id,
              target: cls.id,
              hidden: false,
              data: {
                type: 'contains' as DependencyEdgeKind,
              },
              style: {
                ...getEdgeStyle('contains'),
                strokeDasharray: '5,5',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 15,
                height: 15,
              },
            });
          });
        }

        // Add containment edges from module to interfaces
        if (module.interfaces && Object.keys(module.interfaces).length > 0) {
          mapTypeCollection(module.interfaces, (iface) => {
            edges.push({
              id: `${module.id}-${iface.id}-contains`,
              source: module.id,
              target: iface.id,
              hidden: false,
              data: {
                type: 'contains' as DependencyEdgeKind,
              },
              style: {
                ...getEdgeStyle('contains'),
                strokeDasharray: '5,5',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 15,
                height: 15,
              },
            });
          });
        }

        // Add module imports
        // NOTE: Import edges require resolving import source paths to target module IDs
        // This requires adding target_module_id to the imports table and resolution logic
        // For now, imports are stored but edges are not created until resolution is implemented
        // if (module.imports) {
        //   mapTypeCollection(module.imports, (imp) => {
        //     if (!imp.uuid) return;
        //
        //     edges.push({
        //       id: `${module.id}-${imp.uuid}-import`,
        //       source: module.id,
        //       target: imp.uuid, // TODO: Should be target module ID, not import UUID
        //       data: {
        //         type: 'import' as DependencyEdgeKind,
        //       },
        //       style: getEdgeStyle('import'),
        //       markerEnd: {
        //         type: MarkerType.ArrowClosed,
        //         width: 20,
        //         height: 20,
        //       },
        //     });
        //   });
        // }

        // Add class inheritance and implementation edges
        if (module.classes && Object.keys(module.classes).length > 0) {
          mapTypeCollection(module.classes, (cls) => {
            // Handle class inheritance
            if (cls.extends_id) {
              edges.push({
                id: `${cls.id}-${cls.extends_id}-inheritance`,
                source: cls.id,
                target: cls.extends_id,
                hidden: false,
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
            if (cls.implemented_interfaces && Object.keys(cls.implemented_interfaces).length > 0) {
              mapTypeCollection(cls.implemented_interfaces, (iface) => {
                if (!iface.id) return;

                edges.push({
                  id: `${cls.id}-${iface.id}-implements`,
                  source: cls.id,
                  target: iface.id,
                  hidden: false,
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
        if (module.interfaces && Object.keys(module.interfaces).length > 0) {
          mapTypeCollection(module.interfaces, (iface) => {
            if (iface.extended_interfaces && Object.keys(iface.extended_interfaces).length > 0) {
              mapTypeCollection(iface.extended_interfaces, (extended) => {
                if (!extended.id) return;

                edges.push({
                  id: `${iface.id}-${extended.id}-inheritance`,
                  source: iface.id,
                  target: extended.id,
                  hidden: false,
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
