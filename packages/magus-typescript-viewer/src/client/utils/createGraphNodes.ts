import { getMembersAsProperties } from '../components/DependencyGraph';
import { mapTypeCollection } from '../components/DependencyGraph/mapTypeCollection';
import { getNodeStyle } from '../theme/graphTheme';

import type {
  ClassStructure,
  DependencyKind,
  DependencyNode,
  DependencyPackageGraph,
  InterfaceStructure,
} from '../components/DependencyGraph/types';

/**
 * Creates empty items that match the expected interface for getMembersAsProperties
 */
function createCompatibleTypeInput(item: ClassStructure | InterfaceStructure) {
  return {
    id: item.id,
    name: item.name,
    properties: [],
    methods: [],
  };
}

/**
 * Creates graph nodes from the provided dependency package graph data
 * @param data The dependency package graph data
 * @returns Array of dependency nodes
 */
export function createGraphNodes(data: DependencyPackageGraph): DependencyNode[] {
  // Create package nodes
  const graphNodes: DependencyNode[] = data.packages.map((pkg) => ({
    id: pkg.id,
    type: 'package' as DependencyKind,
    position: { x: 0, y: 0 },
    data: {
      label: pkg.name,
      properties: [{ name: 'version', type: pkg.version, visibility: 'public' }],
    },
    style: getNodeStyle('package'),
  }));

  // Create module nodes
  data.packages.forEach((pkg) => {
    // Add module nodes
    if (pkg.modules) {
      mapTypeCollection(pkg.modules, (module) => {
        graphNodes.push({
          id: module.id,
          type: 'module' as DependencyKind,
          position: { x: 0, y: 0 },
          data: {
            parentId: pkg.id,
            label: module.name,
            properties: [{ name: 'path', type: module.source.relativePath || '', visibility: 'public' }],
          },
          style: getNodeStyle('module'),
          extent: 'parent',
        });

        // Add class nodes
        if (module.classes) {
          mapTypeCollection(module.classes, (cls) => {
            graphNodes.push({
              id: cls.id,
              type: 'class' as DependencyKind,
              position: { x: 0, y: 0 },
              data: {
                parentId: module.id,
                label: cls.name,
                properties: cls.properties,
                methods: cls.methods,
              },
              style: getNodeStyle('class'),
              extent: 'parent',
            });
          });
        }

        // Add interface nodes
        if (module.interfaces) {
          mapTypeCollection(module.interfaces, (iface) => {
            graphNodes.push({
              id: iface.id,
              type: 'interface' as DependencyKind,
              position: { x: 0, y: 0 },
              data: {
                parentId: module.id,
                label: iface.name,
                properties: iface.properties,
                methods: iface.methods,
              },
              style: getNodeStyle('interface'),
              extent: 'parent',
            });
          });
        }
      });
    }
  });

  return graphNodes;
}
