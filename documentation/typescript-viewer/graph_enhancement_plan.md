# Comprehensive Plan for Hierarchical Graph Enhancement Using React Flow and ELKJS

This plan outlines the steps required to implement a hierarchical visualization of packages, modules, and their
associated subdata (classes, interfaces, etc.) by leveraging data from all repositories. We will create a dedicated data
assembler object that gathers comprehensive data from all repositories rather than placing the loading logic into the
module repository.

## Phase 1: Data Model Enhancement ✅

### 1. Module and Subdata Modeling ✅

- [x] **Update Module Model (`src/types/Module.ts`):**

  ```typescript
  interface Module {
    id: string;
    name: string;
    package_id: string;
    source: FileLocation;
    created_at: Date;
    classes: Class[];
    interfaces: Interface[];
    imports: Import[];
    exports: Export[];
    packages: PackageImport[];
    typeAliases: TypeAlias[];
    enums: Enum[];
    referencePaths: string[];
  }
  ```

- [x] **Create Relationship Types:**

  ```typescript
  type RelationshipType = 'IMPORTS' | 'EXPORTS' | 'EXTENDS' | 'IMPLEMENTS' | 'CONTAINS' | 'USES' | 'REFERENCES';
  ```

- [x] **Create or Update Subdata Models:**

  ```typescript
  // src/types/Class.ts
  interface Class {
    id: string;
    name: string;
    methods: Method[];
    properties: Property[];
    extends?: string[];
    implements?: string[];
    decorators?: string[];
    visibility: 'public' | 'private' | 'protected';
    moduleId: string;
  }

  // src/types/Interface.ts
  interface Interface {
    id: string;
    name: string;
    properties: Property[];
    methods: Method[];
    extends?: string[];
    moduleId: string;
  }
  ```

### 2. Data Assembly Layer ✅

- [x] **Create GraphDataAssembler:**

  ```typescript
  // src/assemblers/GraphDataAssembler.ts
  class GraphDataAssembler {
    constructor(
      private packageRepo: PackageRepository,
      private moduleRepo: ModuleRepository,
      private classRepo: ClassRepository,
      private interfaceRepo: InterfaceRepository
    ) {}

    async assembleGraphData(): Promise<GraphData> {
      const packages = await this.packageRepo.retrieveAll();
      const enrichedData = await Promise.all(
        packages.map(async (pkg) => {
          const modules = await this.moduleRepo.retrieveByPackageId(pkg.id);
          const enrichedModules = await Promise.all(
            modules.map(async (module) => ({
              ...module,
              classes: await this.classRepo.retrieveByModuleId(module.id),
              interfaces: await this.interfaceRepo.retrieveByModuleId(module.id),
            }))
          );
          return { ...pkg, modules: enrichedModules };
        })
      );
      return { packages: enrichedData };
    }
  }
  ```

## Phase 2: Graph Construction ✅

### 3. Graph Building Logic ✅

- [x] **Update Graph Builder (`src/utils/graph.ts`):**

  ```typescript
  interface NodeData {
    id: string;
    type: 'package' | 'module' | 'class' | 'interface' | 'method' | 'property';
    label: string;
    data: any;
    parentId?: string;
  }

  function createGraphFromHierarchy(data: GraphData): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    data.forEach((pkg) => {
      // Create package node
      nodes.push(createPackageNode(pkg));

      pkg.modules.forEach((module) => {
        // Create module node
        nodes.push(createModuleNode(module, pkg.id));

        // Create class nodes
        module.classes.forEach((cls) => {
          nodes.push(createClassNode(cls, module.id));
          // Add inheritance edges
          if (cls.extends) {
            cls.extends.forEach((parent) => {
              edges.push(createInheritanceEdge(cls.id, parent));
            });
          }
        });

        // Create interface nodes
        module.interfaces.forEach((iface) => {
          nodes.push(createInterfaceNode(iface, module.id));
          // Add inheritance edges
          if (iface.extends) {
            iface.extends.forEach((parent) => {
              edges.push(createInheritanceEdge(iface.id, parent));
            });
          }
        });

        // Add import/export edges
        module.imports.forEach((imp) => {
          edges.push(createImportEdge(module.id, imp.source));
        });
      });
    });

    return { nodes, edges };
  }
  ```

- [x] **Create Layout Engine Integration:**
  ```typescript
  interface LayoutConfig {
    direction: 'TB' | 'LR' | 'RL' | 'BT';
    nodeSpacing: number;
    rankSpacing: number;
    hierarchical: boolean;
  }
  ```

### 4. Visual Components ✅

- [x] **Enhance DependencyGraph Component:**

  ```typescript
  // src/components/DependencyGraph.tsx
  function DependencyGraph({ data }: { data: GraphData }) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { fitView } = useReactFlow();

    useEffect(() => {
      const { nodes: graphNodes, edges: graphEdges } = createGraphFromHierarchy(data);
      setNodes(graphNodes);
      setEdges(graphEdges);
    }, [data]);

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
    }, []);

    return (
      <div style={{ height: '100vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          fitView
        >
          <Controls />
          <Background />
          {selectedNode && <NodeDetails node={selectedNode} />}
        </ReactFlow>
      </div>
    );
  }
  ```

- [x] **Create Node Detail Panel:**
  ```typescript
  // src/components/NodeDetails.tsx
  function NodeDetails({ node }: { node: Node }) {
    return (
      <Panel position="top-right">
        <Card>
          <CardContent>
            <Typography variant="h6">{node.data.label}</Typography>
            <Typography color="textSecondary">Type: {node.type}</Typography>
            {node.data.properties?.map((prop) => (
              <Typography key={prop.name}>
                {prop.name}: {prop.type}
              </Typography>
            ))}
          </CardContent>
        </Card>
      </Panel>
    );
  }
  ```

## Phase 3: Layout Engine Integration ✅

### 5. ELKJS Setup ✅

- [x] **Install Dependencies:**

  ```bash
  pnpm add elkjs
  ```

- [x] **Create Layout Configuration:**

  ```typescript
  // src/utils/layout.ts
  import ELK from 'elkjs';

  const elk = new ELK();

  const defaultLayoutOptions = {
    'elk.algorithm': 'layered',
    'elk.direction': 'DOWN',
    'elk.spacing.nodeNode': 50,
    'elk.layered.spacing.nodeNodeBetweenLayers': 100,
  };

  async function computeLayout(nodes: Node[], edges: Edge[], options = defaultLayoutOptions) {
    const graph = {
      id: 'root',
      layoutOptions: options,
      children: nodes.map((node) => ({
        id: node.id,
        width: 150,
        height: 50,
        ports: [],
        layoutOptions: {},
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
    };

    const layout = await elk.layout(graph);
    return layout.children?.map((child) => ({
      ...nodes.find((n) => n.id === child.id)!,
      position: { x: child.x || 0, y: child.y || 0 },
    }));
  }
  ```

### 6. Layout Processing ✅

- [x] **Implement Layout Pipeline:**

  ```typescript
  // src/utils/layoutPipeline.ts
  async function processLayout(data: GraphData) {
    // 1. Collect node data
    const { nodes, edges } = createGraphFromHierarchy(data);

    // 2. Process relationships
    const relationships = extractRelationships(nodes, edges);

    // 3. Calculate positions
    const layoutedNodes = await computeLayout(nodes, edges);

    // 4. Apply layout
    const finalNodes = applyLayout(layoutedNodes);

    // 5. Handle updates
    return {
      nodes: finalNodes,
      edges,
      relationships,
    };
  }
  ```

## Phase 4: User Interface Enhancement ✅

### 7. Interactive Features ✅

- [x] **Add Graph Controls:**

  - [x] Zoom controls
  - [x] Fit view button
  - [x] Reset layout button
  - [x] Relationship filter

- [x] **Implement Search:**
  - [x] Entity search
  - [x] Relationship search
  - [x] Path finding
  - [x] History tracking

### 8. Visual Styling ✅

- [x] **Create Theme System:**
  ```typescript
  interface GraphTheme {
    nodes: Record<string, {
        colors: string[];
        borderColor: string;
        fontSize: number;
      }>;
    edges: Record<string, {
        color: string;
        width: number;
        animated: boolean;
      }>;
  }
  ```

## Phase 5: Testing and Documentation

### 9. Test Coverage

- [ ] **Create Test Suites:**

  - [ ] Data assembly tests
  - [ ] Graph construction tests
  - [ ] Layout engine tests
  - [ ] Component tests

- [ ] **Add Performance Tests:**
  - [ ] Large graph rendering
  - [ ] Layout calculation
  - [ ] Search operations
  - [ ] Update operations

### 10. Documentation

- [ ] **Update Documentation:**
  - [ ] Add setup instructions
  - [ ] Include usage examples
  - [ ] Document configuration options
  - [ ] Add troubleshooting guide

## Phase 6: Optimization and Polish ✅

### 11. Performance Optimization ✅

- [x] **Implement Lazy Loading:**

  ```typescript
  // src/hooks/useLazyGraph.ts
  function useLazyGraph(data: GraphData) {
    const [visibleNodes, setVisibleNodes] = useState<Node[]>([]);
    const [page, setPage] = useState(1);
    const pageSize = 50;

    useEffect(() => {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      setVisibleNodes(nodes.slice(start, end));
    }, [page, data]);

    return {
      visibleNodes,
      loadMore: () => setPage((p) => p + 1),
      hasMore: visibleNodes.length < nodes.length,
    };
  }
  ```

### 12. Final Polish ✅

- [x] **Add Final Touches:**
  - [x] Smooth animations
  - [x] Loading states
  - [x] Error handling
  - [x] Accessibility features

## Resources and References

- React Flow Examples: https://reactflow.dev/examples/layout/
- ELKJS Documentation: https://www.eclipse.org/elk/reference.html
- React Flow API: https://reactflow.dev/api-reference/
- React Flow Learn: https://reactflow.dev/learn/

## Notes for Junior Developers

1. Start with Phase 1 and work sequentially through the phases
2. Each checkbox represents a discrete task that can be completed independently
3. Use the provided TypeScript interfaces as your guide
4. Test each component individually before integration
5. Commit your changes frequently with descriptive messages
6. Ask for help if you get stuck on any phase
7. Document any deviations from the plan
8. Use the Resources and References section for guidance

Remember: This is an iterative process. Complete each phase fully before moving to the next one. If you encounter any
issues, consult the team lead before proceeding.
