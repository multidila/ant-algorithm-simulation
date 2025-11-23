export class Agent {
  private _tour!: number[];
  private _tabuList!: Set<number>;
  private _visitedCount!: number;

  public position!: number;
  public tourLength!: number;

  public get tour(): ReadonlyArray<number> {
    return this._tour;
  }

  public get visitedNodesCount(): number {
    return this._visitedCount;
  }

  /**
   * Creates a new agent
   * @param startPosition Starting node index
   */
  constructor(agent: Agent);
  constructor(startPosition: number);
  constructor(args: Agent | number = 0) {
    if (typeof args === 'number') {
      this.reset(args);
    } else {
      this._tour = args._tour;
      this._tabuList = args._tabuList;
      this._visitedCount = args._visitedCount;
      this.position = args.position;
      this.tourLength = args.tourLength;
    }
  }

  /**
   * Moves the agent to a new node
   * @param position Index of the node to move to
   */
  public moveTo(position: number): void {
    this.position = position;
    this._tour.push(position);
    this._tabuList.add(position);
    this._visitedCount++;
  }

  /**
   * Closes the tour by returning to the starting node.
   */
  public closeTour(): void {
    if (this._tour.length === 0) {
      return;
    }
    this._tour = [...this._tour, this._tour[0]];
  }
  /**
   * Gets list of unvisited nodes
   * @param totalNodes Total number of nodes in the graph
   */
  public getUnvisitedNodes(totalNodes: number): number[] {
    const unvisited: number[] = [];
    for (let i = 0; i < totalNodes; i++) {
      if (!this._tabuList.has(i)) {
        unvisited.push(i);
      }
    }
    return unvisited;
  }

  /**
   * Resets the agent to start a new tour
   * @param startPosition Starting node for the new tour
   */
  public reset(startPosition: number = 0): void {
    this._tabuList = new Set([startPosition]);
    this._visitedCount = 1;
    this._tour = [startPosition];
    this.tourLength = 0;
    this.position = startPosition;
  }
}
