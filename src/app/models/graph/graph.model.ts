import { GraphParams } from './graph-params.model';
import { Node } from './node.model';
import { RandomService } from '../../services/random';

/**
 * Graph class that manages nodes, distances, and pheromones
 * Supports k-regular graph generation (each node has approximately k edges)
 */
export class Graph {
  public readonly nodes: Node[];
  public readonly distances: number[][];
  public readonly pheromones: number[][];

  /**
   * Creates a new graph
   * @param params Graph generation parameters including initialPheromone
   * @param randomService Random number generator service
   */
  constructor(
    params: GraphParams & { initialPheromone: number },
    private readonly _randomService: RandomService
  ) {
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
        x: this._randomService.next() * coordinateRange,
        y: this._randomService.next() * coordinateRange,
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
    const distances = this._createMatrix(0);

    if (params.edgesPerNode != null && params.edgesPerNode >= 2) {
      // Build k-regular graph structure with random or euclidean weights
      this._buildKRegularGraph(distances, params);
    } else {
      // Complete graph with euclidean distances
      this._buildCompleteGraph(distances, params);
    }
    return distances;
  }

  /**
   * Builds a complete graph with all possible edges
   * Edge weights are euclidean distances between nodes
   */
  private _buildCompleteGraph(distances: number[][], params: GraphParams): void {
    const n = this.nodes.length;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          distances[i][j] = 0;
        } else {
          distances[i][j] = this._euclideanDistance(this.nodes[i], this.nodes[j]);
        }
      }
    }
  }

  /**
   * Builds a k-regular graph where each node has approximately k edges
   * Uses ring + chords structure for guaranteed connectivity
   * Edge weights are random (if min/max specified) or euclidean
   */
  private _buildKRegularGraph(distances: number[][], params: GraphParams): void {
    const n = this.nodes.length;
    const k = params.edgesPerNode ?? 2;

    // Initialize all distances to Infinity
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        distances[i][j] = i === j ? 0 : Infinity;
      }
    }

    // Build edge structure using ring + chords approach
    const edges = this._generateKRegularStructure(n, k);

    // Assign weights to edges
    const useRandomWeights = params.minDistance != null || params.maxDistance != null;
    const minDist = params.minDistance ?? 10;
    const maxDist = params.maxDistance ?? 100;

    for (const [i, j] of edges) {
      let weight: number;

      if (useRandomWeights) {
        // Generate random weight in range [minDistance, maxDistance]
        weight = minDist + this._randomService.next() * (maxDist - minDist);
      } else {
        // Use euclidean distance
        weight = this._euclideanDistance(this.nodes[i], this.nodes[j]);
      }

      distances[i][j] = weight;
      distances[j][i] = weight;
    }
  }

  /**
   * Generates k-regular graph structure with guaranteed Hamiltonian cycle
   * 1. Creates Hamiltonian cycle (0→1→2→...→n-1→0) ensuring TSP solvability
   * 2. Adds additional edges to reach k edges per node
   * If n*k is odd, one node will have k+1 edges
   */
  private _generateKRegularStructure(n: number, k: number): Array<[number, number]> {
    const edges: Array<[number, number]> = [];
    const degree = new Array(n).fill(0);

    // Step 1: Create Hamiltonian cycle (guarantees TSP solution exists)
    // This creates edges: 0→1, 1→2, 2→3, ..., (n-1)→0
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      edges.push([i, next]);
      degree[i]++;
      degree[next]++;
    }

    // Step 2: Add chord edges symmetrically to approach k edges per node
    // Use offset pattern to maintain balance
    for (let offset = 2; offset <= Math.floor(k / 2); offset++) {
      for (let i = 0; i < n; i++) {
        const j = (i + offset) % n;

        // Only add if both nodes haven't reached k edges yet
        if (degree[i] < k && degree[j] < k) {
          // Check if edge already exists
          const edgeExists = edges.some(
            ([a, b]) => (a === i && b === j) || (a === j && b === i)
          );

          if (!edgeExists) {
            edges.push([i, j]);
            degree[i]++;
            degree[j]++;
          }
        }
      }
    }

    // Step 3: Handle odd k by adding diameter edges (for even n)
    if (k % 2 === 1 && n % 2 === 0) {
      for (let i = 0; i < n / 2; i++) {
        if (degree[i] >= k) {
          continue;
        }

        const j = i + Math.floor(n / 2);
        if (degree[j] < k) {
          const edgeExists = edges.some(
            ([a, b]) => (a === i && b === j) || (a === j && b === i)
          );

          if (!edgeExists) {
            edges.push([i, j]);
            degree[i]++;
            degree[j]++;
          }
        }
      }
    }

    // Step 4: Fill remaining deficits to reach k edges per node
    // Try to connect nodes with lowest degrees first
    for (let targetDegree = Math.min(...degree); targetDegree < k; targetDegree++) {
      for (let i = 0; i < n; i++) {
        if (degree[i] >= k) {
          continue;
        }

        // Find best candidate: node with lowest degree that we're not connected to
        let bestCandidate = -1;
        let minCandidateDegree = k + 1;

        for (let j = 0; j < n; j++) {
          if (i === j || degree[j] >= k) {
            continue;
          }

          const edgeExists = edges.some(
            ([a, b]) => (a === i && b === j) || (a === j && b === i)
          );

          if (!edgeExists && degree[j] < minCandidateDegree) {
            bestCandidate = j;
            minCandidateDegree = degree[j];
          }
        }

        if (bestCandidate !== -1) {
          edges.push([i, bestCandidate]);
          degree[i]++;
          degree[bestCandidate]++;
        }
      }
    }

    return edges;
  }

  private _euclideanDistance(nodeA: Node, nodeB: Node): number {
    const dx = nodeA.x - nodeB.x;
    const dy = nodeA.y - nodeB.y;
    return Math.hypot(dx, dy);
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
