import { GraphParams } from './graph-params.model';
import { Node } from './node.model';

/**
 * Graph class that manages nodes, distances, and pheromones
 * Supports k-regular graph generation (limited edges per node)
 */
export class Graph {
  public readonly nodes: Node[];
  public readonly distances: number[][];
  public readonly pheromones: number[][];

  /**
   * Creates a new graph
   * @param params Graph generation parameters including initialPheromone
   */
  constructor(params: GraphParams & { initialPheromone: number }) {
    this.nodes = this._generateNodes(params);
    this.distances = this._buildDistanceMatrix(params);
    this.pheromones = this._createMatrix(params.initialPheromone);
  }

  /**
   * Generates random node coordinates
   * Nodes are placed randomly; minDistance/maxDistance constraints are applied to edges later
   */
  private _generateNodes(params: GraphParams): Node[] {
    const { count } = params;
    const nodes: Node[] = [];

    // Calculate coordinate range based on node count
    // Scale by sqrt(count) to give proportional space
    const coordinateRange = 100 * Math.sqrt(count);

    for (let i = 0; i < count; i++) {
      nodes.push({
        id: i,
        x: Math.random() * coordinateRange,
        y: Math.random() * coordinateRange,
      });
    }

    return nodes;
  }

  private _createMatrix(value: number): number[][] {
    return Array(this.nodes.length)
      .fill(0)
      .map(() => Array(this.nodes.length).fill(value));
  }

  private _buildDistanceMatrix(params: GraphParams): number[][] {
    const distances = this._calculateDistances(params);
    if (params.maxEdgesPerNode != null && params.maxEdgesPerNode > 0) {
      this._applyKRegularConstraint(distances, params.maxEdgesPerNode);
    }
    return distances;
  }

  private _calculateDistances(params: GraphParams): number[][] {
    const n = this.nodes.length;
    const distances = this._createMatrix(0);
    const { minDistance, maxDistance } = params;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          distances[i][j] = 0;
        } else {
          const distance = this._euclideanDistance(this.nodes[i], this.nodes[j]);

          // Apply min/max distance constraints
          if (minDistance != null && distance < minDistance) {
            distances[i][j] = Infinity;
          } else if (maxDistance != null && distance > maxDistance) {
            distances[i][j] = Infinity;
          } else {
            distances[i][j] = distance;
          }
        }
      }
    }
    return distances;
  }

  /**
   * Applies k-regular constraint by first building MST for connectivity, then adding nearest neighbors
   * This ensures the graph is always connected without "breaking and fixing"
   */
  private _applyKRegularConstraint(distances: number[][], k: number): void {
    // Step 1: Build Minimum Spanning Tree (MST) to ensure connectivity
    const mstEdges = this._buildMST(distances);

    // Step 2: Start with infinity for all edges
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = 0; j < this.nodes.length; j++) {
        if (i !== j) {
          distances[i][j] = Infinity;
        }
      }
    }

    // Step 3: Add MST edges back (guaranteed connectivity)
    for (const [from, to, distance] of mstEdges) {
      distances[from][to] = distance;
      distances[to][from] = distance;
    }

    // Step 4: For each node, add k nearest neighbors (including MST edges)
    for (let i = 0; i < this.nodes.length; i++) {
      // Get all possible edges with their distances
      const edges: Array<{ node: number; distance: number }> = [];
      for (let j = 0; j < this.nodes.length; j++) {
        if (j !== i) {
          edges.push({
            node: j,
            distance: this._euclideanDistance(this.nodes[i], this.nodes[j]),
          });
        }
      }

      // Sort by distance to get nearest neighbors
      edges.sort((a, b) => a.distance - b.distance);

      // Keep k nearest neighbors
      const keepNodes = edges.slice(0, k);

      for (const edge of keepNodes) {
        distances[i][edge.node] = edge.distance;
        distances[edge.node][i] = edge.distance;
      }
    }
  }

  /**
   * Builds Minimum Spanning Tree using Prim's algorithm
   * Returns array of edges: [from, to, distance]
   */
  private _buildMST(distances: number[][]): Array<[number, number, number]> {
    const n = this.nodes.length;
    const mstEdges: Array<[number, number, number]> = [];
    const visited = new Array(n).fill(false);
    const minDistance = new Array(n).fill(Infinity);
    const parent = new Array(n).fill(-1);

    // Start from node 0
    minDistance[0] = 0;

    for (let i = 0; i < n; i++) {
      // Find unvisited node with minimum distance
      let minDist = Infinity;
      let minNode = -1;

      for (let j = 0; j < n; j++) {
        if (!visited[j] && minDistance[j] < minDist) {
          minDist = minDistance[j];
          minNode = j;
        }
      }

      if (minNode === -1) {
        break;
      }

      visited[minNode] = true;

      // Add edge to MST (except for the first node)
      if (parent[minNode] !== -1) {
        mstEdges.push([parent[minNode], minNode, minDistance[minNode]]);
      }

      // Update distances to neighbors
      for (let j = 0; j < n; j++) {
        if (!visited[j] && distances[minNode][j] < minDistance[j]) {
          minDistance[j] = distances[minNode][j];
          parent[j] = minNode;
        }
      }
    }

    return mstEdges;
  }

  private _euclideanDistance(nodeA: Node, nodeB: Node): number {
    const dx = nodeA.x - nodeB.x;
    const dy = nodeA.y - nodeB.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Gets distance between two nodes
   * @param i
   * @param j
   */
  public getDistance(i: number, j: number): number {
    return this.distances[i][j];
  }

  public getDistances(): number[][] {
    return this.distances.map((row) => row.slice());
  }

  /**
   * Gets pheromone level on edge between two nodes
   * @param i
   * @param j
   */
  public getPheromone(i: number, j: number): number {
    return this.pheromones[i][j];
  }

  /**
   * Calculates total distance of a tour
   * @param tour
   */
  public calculateDistance(tour: ReadonlyArray<number>): number {
    if (tour.length === 0 || tour.length === 1) {
      return 0;
    }
    let length = 0;
    for (let i = 0; i < tour.length - 1; i++) {
      length += this.getDistance(tour[i], tour[i + 1]);
    }
    return length;
  }

  /**
   * Filters candidate nodes that are reachable from the current node
   * @param currentNode
   * @param candidateNodes
   */
  public getReachableNodes(currentNode: number, candidateNodes: ReadonlyArray<number>): number[] {
    return candidateNodes.filter((node) => {
      const distance = this.getDistance(currentNode, node);
      return distance !== Infinity && distance > 0;
    });
  }

  /**
   * Updates pheromone level on an edge
   * @param i
   * @param j
   * @param value
   */
  public updatePheromone(i: number, j: number, value: number): void {
    this.pheromones[i][j] = value;
    this.pheromones[j][i] = value;
  }

  /**
   * Evaporates pheromones on all edges
   * @param evaporationRate
   */
  public evaporatePheromones(evaporationRate: number): void {
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = 0; j < this.nodes.length; j++) {
        this.pheromones[i][j] *= 1 - evaporationRate;
      }
    }
  }
}
