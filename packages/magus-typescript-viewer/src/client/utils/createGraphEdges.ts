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
          type: 'dependency' as DependencyEdgeKind,
          style: getEdgeStyle('dependency'),
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
          type: 'devDependency' as DependencyEdgeKind,
          style: getEdgeStyle('devDependency'),
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
          type: 'peerDependency' as DependencyEdgeKind,
          style: getEdgeStyle('peerDependency'),
        });
      });
    }

    // Handle module dependencies
    if (pkg.modules) {
      mapTypeCollection(pkg.modules, (module) => {
        // Add module imports
        if (module.imports) {
          mapTypeCollection(module.imports, (imp) => {
            if (!imp.uuid) return;

            edges.push({
              id: `${module.id}-${imp.uuid}-import`,
              source: module.id,
              target: imp.uuid,
              type: 'import' as DependencyEdgeKind,
              style: getEdgeStyle('import'),
            });
          });
        }

        // Add class inheritance and implementation edges
        if (module.classes) {
          mapTypeCollection(module.classes, (cls) => {
            // Handle class inheritance
            if (cls.extends_id) {
              edges.push({
                id: `${cls.id}-${cls.extends_id}-inheritance`,
                source: cls.id,
                target: cls.extends_id,
                type: 'inheritance' as DependencyEdgeKind,
                style: getEdgeStyle('inheritance'),
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
                  type: 'implements' as DependencyEdgeKind,
                  style: getEdgeStyle('implements'),
                });
              });
            }
          });
        }

        // Add interface inheritance edges
        if (module.interfaces) {
          mapTypeCollection(module.interfaces, (iface) => {
            if (iface.extended_interfaces) {
              mapTypeCollection(iface.extended_interfaces, (extended) => {
                if (!extended.id) return;

                edges.push({
                  id: `${iface.id}-${extended.id}-inheritance`,
                  source: iface.id,
                  target: extended.id,
                  type: 'inheritance' as DependencyEdgeKind,
                  style: getEdgeStyle('inheritance'),
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
