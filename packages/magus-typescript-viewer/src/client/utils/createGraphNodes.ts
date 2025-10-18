// import { getMembersAsProperties } from '../components/DependencyGraph';
import { mapTypeCollection } from '../components/DependencyGraph/mapTypeCollection';
import { getNodeStyle } from '../theme/graphTheme';

import type { DependencyKind, DependencyNode, DependencyPackageGraph } from '../components/DependencyGraph/types';

/**
 * Creates empty items that match the expected interface for getMembersAsProperties
 */
// function createCompatibleTypeInput(item: ClassStructure | InterfaceStructure) {
//   return {
//     id: item.id,
//     name: item.name,
//     properties: [],
//     methods: [],
//   };
// }

/**
 * Creates graph nodes from the provided dependency package graph data
 * @param data The dependency package graph data
 * @param options Configuration options for node creation
 * @returns Array of dependency nodes
 */
export function createGraphNodes(
  data: DependencyPackageGraph,
  options: { includePackages?: boolean; includeClasses?: boolean } = {}
): DependencyNode[] {
  const { includePackages = false, includeClasses = false } = options;

  const graphNodes: DependencyNode[] = [];

  // Optionally create package nodes
  if (includePackages) {
    data.packages.forEach((pkg) => {
      graphNodes.push({
        id: pkg.id,
        type: 'package' as DependencyKind,
        position: { x: 0, y: 0 },
        expandParent: true,
        data: {
          label: pkg.name,
          properties: [{ name: 'version', type: pkg.version, visibility: 'public' }],
        },
        style: {
          ...getNodeStyle('package'),
        },
      });
    });
  }

  // Create module nodes
  data.packages.forEach((pkg) => {
    // Add module nodes
    if (pkg.modules) {
      mapTypeCollection(pkg.modules, (module) => {
        const moduleNode: DependencyNode = {
          id: module.id,
          type: 'module' as DependencyKind,
          position: { x: 0, y: 0 },
          data: {
            label: module.name,
            properties: [
              { name: 'package', type: pkg.name, visibility: 'public' },
              { name: 'path', type: module.source.relativePath || '', visibility: 'public' },
            ],
          },
          style: {
            ...getNodeStyle('module'),
          },
        };

        // Only add parent relationship if packages are included
        if (includePackages) {
          moduleNode.parentNode = pkg.id;
          moduleNode.extent = 'parent' as const;
          moduleNode.expandParent = true;
          moduleNode.data.parentId = pkg.id;
        }

        graphNodes.push(moduleNode);

        // Optionally add class and interface nodes
        if (includeClasses) {
          // Add class nodes
          if (module.classes) {
            mapTypeCollection(module.classes, (cls) => {
              // Convert Map/Object to array for properties and methods
              const properties = cls.properties
                ? mapTypeCollection(cls.properties, (prop) => ({
                    name: prop.name,
                    type: prop.type,
                    visibility: prop.visibility,
                  }))
                : [];

              const methods = cls.methods
                ? mapTypeCollection(cls.methods, (method) => {
                    const returnType: string = (method.returnType as string | undefined) ?? 'void';
                    const methodName: string = method.name;
                    const visibility: string = method.visibility;
                    return {
                      name: methodName,
                      returnType,
                      visibility,
                      signature: `${methodName}(): ${returnType}`,
                    };
                  })
                : [];

              graphNodes.push({
                id: cls.id,
                type: 'class' as DependencyKind,
                position: { x: 0, y: 0 },
                parentNode: module.id,
                extent: 'parent' as const,
                expandParent: true,
                data: {
                  parentId: module.id,
                  label: cls.name,
                  properties,
                  methods,
                },
                style: {
                  ...getNodeStyle('class'),
                },
              });
            });
          }

          // Add interface nodes
          if (module.interfaces) {
            mapTypeCollection(module.interfaces, (iface) => {
              // Convert Map/Object to array for properties and methods
              const properties = iface.properties
                ? mapTypeCollection(iface.properties, (prop) => ({
                    name: prop.name,
                    type: prop.type,
                    visibility: prop.visibility,
                  }))
                : [];

              const methods = iface.methods
                ? mapTypeCollection(iface.methods, (method) => {
                    const returnType: string = (method.returnType as string | undefined) ?? 'void';
                    const methodName: string = method.name;
                    const visibility: string = method.visibility;
                    return {
                      name: methodName,
                      returnType,
                      visibility,
                      signature: `${methodName}(): ${returnType}`,
                    };
                  })
                : [];

              graphNodes.push({
                id: iface.id,
                type: 'interface' as DependencyKind,
                position: { x: 0, y: 0 },
                parentNode: module.id,
                extent: 'parent' as const,
                expandParent: true,
                data: {
                  parentId: module.id,
                  label: iface.name,
                  properties,
                  methods,
                },
                style: {
                  ...getNodeStyle('interface'),
                },
              });
            });
          }
        }
      });
    }
  });

  return graphNodes;
}
