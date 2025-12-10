import { Component, effect, ElementRef, input, OnDestroy, viewChild } from '@angular/core';
import { Data, DataSet, Network, Options } from 'vis-network/standalone';

import { AlgorithmIterationResult } from '../../models/algorithm';
import { Graph, Node } from '../../models/graph';

const NETWORK_OPTIONS: Options = {
  nodes: {
    shape: 'circle',
    font: { size: 16, color: '#ffffff', face: 'Arial', align: 'right' },
    borderWidth: 2,
    borderWidthSelected: 3,
    color: {
      border: '#667eea',
      background: '#667eea',
      highlight: { border: '#4c51bf', background: '#4c51bf' },
      hover: { border: '#4c51bf', background: '#667eea' },
    },
    fixed: { x: false, y: false },
    chosen: { node: true, label: false },
  },
  edges: {
    width: 1,
    color: { color: '#999999', highlight: '#f56565', hover: '#667eea' },
    smooth: { enabled: true, type: 'continuous', roundness: 0.5 },
  },
  physics: { enabled: false },
  interaction: {
    hover: true,
    tooltipDelay: 200,
    dragNodes: true,
    dragView: true,
    zoomView: true,
  },
};

interface GraphNodeData {
  id: number;
  x: number;
  y: number;
  label: string;
  title: string;
}

interface GraphEdgeData {
  id: string;
  from: number;
  to: number;
  width: number;
  color: { color: string };
  dashes: boolean;
  title: string;
}

type GraphEdgeUpdate = Partial<GraphEdgeData> & { id: string };

@Component({
  selector: 'app-graph-visualization',
  standalone: true,
  template: '<div #networkContainer class="network-container"></div>',
  styles: [
    `
      .network-container {
        width: 100%;
        height: 600px;
        border: 2px solid #ddd;
        border-radius: 8px;
        background: #f9f9f9;
      }
    `,
  ],
})
export class GraphVisualizationComponent implements OnDestroy {
  private _network: Network | null = null;
  private readonly _nodesData = new DataSet<GraphNodeData>([]);
  private readonly _edgesData = new DataSet<GraphEdgeData>([]);

  protected readonly networkContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('networkContainer');

  public readonly graph = input<Graph | null>(null);
  public readonly iteration = input<AlgorithmIterationResult | null>(null);

  constructor() {
    effect(() => {
      this._destroyNetwork();
      if (this.graph() && this.networkContainer()) {
        this._initNetwork();
      }
    });

    effect(() => {
      if (!this.iteration() || !this._network) {
        return;
      }
      this._updateEdgeThickness();
      this._highlightBestRoute();
    });
  }

  private get _nodes(): Node[] {
    return this.graph()?.nodes ?? [];
  }

  private _initNetwork(): void {
    const container = this.networkContainer();
    if (!this.graph() || !container) {
      return;
    }
    const data: Data = {
      nodes: this._nodesData,
      edges: this._edgesData,
    };
    this._network = new Network(container.nativeElement, data, NETWORK_OPTIONS);
    this._updateNetwork();
  }

  private _destroyNetwork(): void {
    this._network?.destroy();
    this._network = null;
    this._nodesData.clear();
    this._edgesData.clear();
  }

  private _updateNetwork(): void {
    const graph = this.graph();
    if (!this._network || !graph || this._nodes.length === 0) {
      return;
    }
    this._nodesData.clear();
    this._edgesData.clear();

    const distances = graph.getDistances();
    const nodesData = this._nodes.map((node, index) =>
      this._getNodeData(node, index, distances[index])
    );
    this._nodesData.add(nodesData);

    const edgesData: GraphEdgeData[] = [];
    for (let i = 0; i < this._nodes.length; i++) {
      for (let j = i + 1; j < this._nodes.length; j++) {
        const distance = distances[i][j];
        if (distance === Infinity) {
          continue;
        }
        edgesData.push(this._getEdgeData(i, j, distance));
      }
    }
    this._edgesData.add(edgesData);

    // Center and fit the graph in the viewport
    this._network.fit({
      animation: {
        duration: 500,
        easingFunction: 'easeInOutQuad',
      },
    });
  }

  private _getNodeData(node: Node, index: number, distances: number[]): GraphNodeData {
    return {
      id: index,
      label: index.toString(),
      x: node.x - 400,
      y: node.y - 300,
      title: this._getNodeTitle(node, index, distances),
    };
  }

  private _getNodeTitle(node: Node, index: number, distances: number[]): string {
    const lines = [
      `City ${index}`,
      `Coordinates: (${node.x.toFixed(0)}, ${node.y.toFixed(0)})`,
      '',
      'Distances:',
    ];
    distances.forEach((value, distanceIndex) => {
      if (index !== distanceIndex && value !== Infinity) {
        lines.push(`  to city ${distanceIndex}: ${value.toFixed(2)}`);
      }
    });
    return lines.join('\n');
  }

  private _getEdgeData(fromIndex: number, toIndex: number, distance: number): GraphEdgeData {
    return {
      id: `edge-${fromIndex}-${toIndex}`,
      from: fromIndex,
      to: toIndex,
      width: 0.5,
      color: { color: '#999999' },
      dashes: true,
      title: `Distance: ${distance.toFixed(2)}`,
    };
  }

  private _updateEdgeThickness(): void {
    const graph = this.graph();
    if (!graph) {
      return;
    }

    const pheromones = graph.pheromones;
    let maxPheromone = 0.1;
    for (let i = 0; i < pheromones.length; i++) {
      for (let j = i + 1; j < pheromones[i].length; j++) {
        maxPheromone = Math.max(maxPheromone, pheromones[i][j]);
      }
    }

    const updates: GraphEdgeUpdate[] = [];
    for (let i = 0; i < this._nodes.length; i++) {
      for (let j = i + 1; j < this._nodes.length; j++) {
        const edgeId = `edge-${i}-${j}`;
        const edge = this._edgesData.get(edgeId);
        if (!edge) {
          continue;
        }

        const pheromoneLevel = pheromones[i][j];
        const normalized = pheromoneLevel / maxPheromone;
        const baseTitle = edge.title?.split('\n')[0] ?? '';

        updates.push({
          id: edgeId,
          width: 0.5 + normalized * 5,
          color: { color: `rgba(120, 120, 120, ${0.2 + normalized * 0.6})` },
          dashes: normalized < 0.1,
          title: `${baseTitle}\nPheromone: ${pheromoneLevel.toFixed(4)}`,
        });
      }
    }

    if (updates.length > 0) {
      this._edgesData.update(updates);
    }
  }

  private _highlightBestRoute(): void {
    const tour = this.iteration()?.bestTour;
    if (!tour) {
      return;
    }
    for (let i = 0; i < tour.length - 1; i++) {
      const from = Math.min(tour[i], tour[i + 1]);
      const to = Math.max(tour[i], tour[i + 1]);
      const edgeId = `edge-${from}-${to}`;
      const edge = this._edgesData.get(edgeId);
      if (!edge) {
        continue;
      }
      this._edgesData.update({
        id: edgeId,
        width: 4,
        color: { color: '#f56565' },
        dashes: false,
      });
    }
  }


  public ngOnDestroy(): void {
    this._destroyNetwork();
  }
}
