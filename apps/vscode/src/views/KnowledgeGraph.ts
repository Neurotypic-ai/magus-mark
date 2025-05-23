import * as vscode from 'vscode';

import type { TagRelationship, TaggedNote } from '../services/VaultIntegrationService';

interface GraphNode {
  id: string;
  label: string;
  type: 'tag' | 'file' | 'cluster';
  size: number;
  connections: number;
  metadata?: Record<string, unknown>;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: 'tag-file' | 'tag-tag' | 'file-file';
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class KnowledgeGraphView implements vscode.WebviewViewProvider {
  public static readonly viewType = 'magusKnowledgeGraph';

  private _view?: vscode.WebviewView;
  private _context: vscode.ExtensionContext;
  private _currentData: GraphData = { nodes: [], edges: [] };

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._context.extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'nodeClicked':
            this.handleNodeClick(message.nodeId);
            break;
          case 'edgeClicked':
            this.handleEdgeClick(message.source, message.target);
            break;
          case 'filterChanged':
            this.handleFilterChange(message.filter);
            break;
          case 'ready':
            this.updateGraph();
            break;
        }
      },
      undefined,
      this._context.subscriptions
    );
  }

  public updateData(notes: TaggedNote[], relationships: TagRelationship[]): void {
    this._currentData = this.buildGraphData(notes, relationships);
    this.updateGraph();
  }

  private buildGraphData(notes: TaggedNote[], relationships: TagRelationship[]): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeMap = new Map<string, GraphNode>();

    // Create tag nodes
    const tagCounts = new Map<string, number>();
    notes.forEach((note) => {
      note.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    tagCounts.forEach((count, tag) => {
      const node: GraphNode = {
        id: `tag:${tag}`,
        label: tag,
        type: 'tag',
        size: Math.log(count + 1) * 10,
        connections: count,
        metadata: { count },
      };
      nodes.push(node);
      nodeMap.set(node.id, node);
    });

    // Create file nodes
    notes.forEach((note) => {
      const node: GraphNode = {
        id: `file:${note.path}`,
        label: note.title || note.path.split('/').pop() || 'Untitled',
        type: 'file',
        size: note.tags.length * 5 + 10,
        connections: note.tags.length,
        metadata: {
          path: note.path,
          tags: note.tags,
          wordCount: note.content?.length || 0,
        },
      };
      nodes.push(node);
      nodeMap.set(node.id, node);

      // Create tag-file edges
      note.tags.forEach((tag) => {
        edges.push({
          source: `tag:${tag}`,
          target: node.id,
          weight: 1,
          type: 'tag-file',
        });
      });
    });

    // Create tag-tag relationship edges
    relationships.forEach((rel) => {
      const sourceId = `tag:${rel.sourceTag}`;
      const targetId = `tag:${rel.targetTag}`;

      if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
        edges.push({
          source: sourceId,
          target: targetId,
          weight: rel.strength,
          type: 'tag-tag',
        });
      }
    });

    return { nodes, edges };
  }

  private updateGraph(): void {
    if (!this._view) {
      return;
    }

    this._view.webview.postMessage({
      command: 'updateGraph',
      data: this._currentData,
    });
  }

  private async handleNodeClick(nodeId: string): Promise<void> {
    const node = this._currentData.nodes.find((n) => n.id === nodeId);
    if (!node) {
      return;
    }

    if (node.type === 'file' && node.metadata?.path) {
      // Open the file
      const uri = vscode.Uri.file(node.metadata.path as string);
      try {
        await vscode.window.showTextDocument(uri);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to open file: ${error}`);
      }
    } else if (node.type === 'tag') {
      // Show tag details in a quick pick
      await this.showTagDetails(node.label);
    }
  }

  private async handleEdgeClick(source: string, target: string): Promise<void> {
    const edge = this._currentData.edges.find(
      (e) => (e.source === source && e.target === target) || (e.source === target && e.target === source)
    );

    if (!edge) {
      return;
    }

    const sourceNode = this._currentData.nodes.find((n) => n.id === source);
    const targetNode = this._currentData.nodes.find((n) => n.id === target);

    if (sourceNode && targetNode) {
      vscode.window.showInformationMessage(
        `Connection: ${sourceNode.label} ↔ ${targetNode.label} (strength: ${edge.weight.toFixed(2)})`
      );
    }
  }

  private handleFilterChange(filter: { type?: string; minConnections?: number }): void {
    // Apply filtering logic here
    const filteredData = this.applyFilter(this._currentData, filter);

    if (this._view) {
      this._view.webview.postMessage({
        command: 'updateGraph',
        data: filteredData,
      });
    }
  }

  private applyFilter(data: GraphData, filter: { type?: string; minConnections?: number }): GraphData {
    let filteredNodes = data.nodes;

    if (filter.type && filter.type !== 'all') {
      filteredNodes = filteredNodes.filter((node) => node.type === filter.type);
    }

    if (filter.minConnections !== undefined) {
      filteredNodes = filteredNodes.filter((node) => node.connections >= filter.minConnections);
    }

    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = data.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

    return { nodes: filteredNodes, edges: filteredEdges };
  }

  private async showTagDetails(tag: string): Promise<void> {
    const relatedFiles = this._currentData.nodes
      .filter((n) => n.type === 'file' && n.metadata?.tags?.includes(tag))
      .map((n) => ({
        label: n.label,
        description: n.metadata?.path as string,
        detail: `${n.connections} tags`,
      }));

    const selected = await vscode.window.showQuickPick(relatedFiles, {
      title: `Files tagged with "${tag}"`,
      placeHolder: 'Select a file to open',
    });

    if (selected?.description) {
      const uri = vscode.Uri.file(selected.description);
      await vscode.window.showTextDocument(uri);
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Knowledge Graph</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        
        .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        
        .controls {
            padding: 10px;
            background-color: var(--vscode-panel-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .control-group {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        
        select, input {
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 2px 6px;
            font-size: 12px;
        }
        
        #graph {
            flex: 1;
            position: relative;
            overflow: hidden;
        }
        
        .node {
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .node:hover {
            stroke: var(--vscode-focusBorder);
            stroke-width: 2px;
        }
        
        .node.tag {
            fill: var(--vscode-charts-blue);
        }
        
        .node.file {
            fill: var(--vscode-charts-green);
        }
        
        .node.cluster {
            fill: var(--vscode-charts-purple);
        }
        
        .edge {
            stroke: var(--vscode-editorGroup-border);
            stroke-opacity: 0.6;
            cursor: pointer;
        }
        
        .edge:hover {
            stroke: var(--vscode-focusBorder);
            stroke-opacity: 1;
            stroke-width: 2px;
        }
        
        .edge.tag-file {
            stroke-dasharray: 2,2;
        }
        
        .edge.tag-tag {
            stroke-width: 2px;
        }
        
        .tooltip {
            position: absolute;
            background-color: var(--vscode-editorHoverWidget-background);
            border: 1px solid var(--vscode-editorHoverWidget-border);
            padding: 8px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            max-width: 200px;
        }
        
        .stats {
            display: flex;
            gap: 15px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="controls">
            <div class="control-group">
                <label for="typeFilter">Type:</label>
                <select id="typeFilter">
                    <option value="all">All</option>
                    <option value="tag">Tags only</option>
                    <option value="file">Files only</option>
                </select>
            </div>
            <div class="control-group">
                <label for="minConnections">Min connections:</label>
                <input type="number" id="minConnections" min="0" value="0" style="width: 50px;">
            </div>
            <div class="stats">
                <span id="nodeCount">Nodes: 0</span>
                <span id="edgeCount">Edges: 0</span>
            </div>
        </div>
        <div id="graph"></div>
    </div>
    
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        
        let currentData = { nodes: [], edges: [] };
        let simulation;
        let svg, g, nodes, edges;
        
        function initializeGraph() {
            const container = d3.select('#graph');
            const rect = container.node().getBoundingClientRect();
            
            svg = container.append('svg')
                .attr('width', '100%')
                .attr('height', '100%')
                .style('display', 'block');
                
            g = svg.append('g');
            
            // Add zoom behavior
            const zoom = d3.zoom()
                .scaleExtent([0.1, 3])
                .on('zoom', (event) => {
                    g.attr('transform', event.transform);
                });
            
            svg.call(zoom);
            
            // Initialize simulation
            simulation = d3.forceSimulation()
                .force('link', d3.forceLink().id(d => d.id).distance(80))
                .force('charge', d3.forceManyBody().strength(-200))
                .force('center', d3.forceCenter(rect.width / 2, rect.height / 2))
                .force('collision', d3.forceCollide().radius(d => d.size + 5));
        }
        
        function updateVisualization(data) {
            currentData = data;
            
            // Update stats
            document.getElementById('nodeCount').textContent = \`Nodes: \${data.nodes.length}\`;
            document.getElementById('edgeCount').textContent = \`Edges: \${data.edges.length}\`;
            
            // Clear existing elements
            g.selectAll('*').remove();
            
            // Create edges
            edges = g.append('g')
                .attr('class', 'edges')
                .selectAll('line')
                .data(data.edges)
                .enter().append('line')
                .attr('class', d => \`edge \${d.type}\`)
                .attr('stroke-width', d => Math.sqrt(d.weight * 2))
                .on('click', function(event, d) {
                    vscode.postMessage({
                        command: 'edgeClicked',
                        source: d.source.id || d.source,
                        target: d.target.id || d.target
                    });
                });
            
            // Create nodes
            nodes = g.append('g')
                .attr('class', 'nodes')
                .selectAll('circle')
                .data(data.nodes)
                .enter().append('circle')
                .attr('class', d => \`node \${d.type}\`)
                .attr('r', d => Math.max(5, Math.min(20, d.size)))
                .on('click', function(event, d) {
                    vscode.postMessage({
                        command: 'nodeClicked',
                        nodeId: d.id
                    });
                })
                .on('mouseover', showTooltip)
                .on('mouseout', hideTooltip)
                .call(d3.drag()
                    .on('start', dragStarted)
                    .on('drag', dragged)
                    .on('end', dragEnded));
            
            // Add labels
            const labels = g.append('g')
                .attr('class', 'labels')
                .selectAll('text')
                .data(data.nodes)
                .enter().append('text')
                .text(d => d.label)
                .attr('font-size', '10px')
                .attr('fill', 'var(--vscode-editor-foreground)')
                .attr('text-anchor', 'middle')
                .attr('dy', '.35em')
                .style('pointer-events', 'none');
            
            // Update simulation
            simulation.nodes(data.nodes);
            simulation.force('link').links(data.edges);
            
            simulation.on('tick', () => {
                edges
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);
                
                nodes
                    .attr('cx', d => d.x)
                    .attr('cy', d => d.y);
                    
                labels
                    .attr('x', d => d.x)
                    .attr('y', d => d.y + Math.max(5, Math.min(20, d.size)) + 12);
            });
            
            simulation.alpha(1).restart();
        }
        
        function showTooltip(event, d) {
            const tooltip = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0);
            
            const content = d.type === 'file' 
                ? \`File: \${d.label}<br/>Tags: \${d.connections}<br/>Path: \${d.metadata?.path || 'Unknown'}\`
                : \`Tag: \${d.label}<br/>Files: \${d.metadata?.count || 0}<br/>Connections: \${d.connections}\`;
            
            tooltip.html(content)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px')
                .transition()
                .duration(200)
                .style('opacity', 1);
        }
        
        function hideTooltip() {
            d3.selectAll('.tooltip').remove();
        }
        
        function dragStarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragEnded(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        
        // Event listeners
        document.getElementById('typeFilter').addEventListener('change', (e) => {
            vscode.postMessage({
                command: 'filterChanged',
                filter: { 
                    type: e.target.value,
                    minConnections: parseInt(document.getElementById('minConnections').value) || 0
                }
            });
        });
        
        document.getElementById('minConnections').addEventListener('input', (e) => {
            vscode.postMessage({
                command: 'filterChanged',
                filter: { 
                    type: document.getElementById('typeFilter').value,
                    minConnections: parseInt(e.target.value) || 0
                }
            });
        });
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateGraph':
                    updateVisualization(message.data);
                    break;
            }
        });
        
        // Initialize
        initializeGraph();
        
        // Tell the extension we're ready
        vscode.postMessage({ command: 'ready' });
    </script>
</body>
</html>`;
  }
}
