import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { AlgorithmStatus } from '../../enums';
import { Agent, AlgorithmIterationResult, AlgorithmParams } from '../../models/algorithm';
import { Graph } from '../../models/graph';

@Injectable()
export class AntColonyOptimization {
  private readonly _status$ = new BehaviorSubject<AlgorithmStatus>(AlgorithmStatus.Stopped);

  private _graph!: Graph;
  private _params!: AlgorithmParams;

  private _agents: Agent[] = [];
  private _bestAgent: Agent | null = null;

  private get _stopped(): boolean {
    return this._status$.value === AlgorithmStatus.Stopped;
  }

  public get status$(): Observable<AlgorithmStatus> {
    return this._status$.asObservable();
  }

  private _initialize(graph: Graph, params: AlgorithmParams): void {
    this._graph = graph;
    this._params = params;
    this._agents = [];
    this._bestAgent = null;
    for (let i = 0; i < this._params.antCount; i++) {
      const startPosition = i % this._graph.nodes.length;
      this._agents.push(new Agent(startPosition));
    }
  }

  private _selectNextNode(agent: Agent): number {
    const currentNode = agent.position;
    const unvisitedNodes = agent.getUnvisitedNodes(this._graph.nodes.length);
    if (unvisitedNodes.length === 0) {
      return agent.tour[0];
    }
    const reachableNodes = this._graph.getReachableNodes(agent.position, unvisitedNodes);
    if (reachableNodes.length === 0) {
      console.warn(`Agent at node ${currentNode} has no reachable unvisited nodes`);
      return agent.tour[0];
    }
    if (reachableNodes.length === 1) {
      return reachableNodes[0];
    }
    const attractiveness: number[] = [];
    let totalProbability = 0;
    for (const nextNode of reachableNodes) {
      const distance = this._graph.getDistance(currentNode, nextNode);
      const pheromone = this._graph.getPheromone(currentNode, nextNode);
      const visibility = distance === 0 ? Number.POSITIVE_INFINITY : 1 / distance;

      const value =
        Math.pow(pheromone, this._params.alpha) * Math.pow(visibility, this._params.beta);
      attractiveness.push(value);
      totalProbability += value;
    }
    if (totalProbability <= 0) {
      const randomIndex = Math.floor(Math.random() * reachableNodes.length);
      return reachableNodes[randomIndex];
    }
    const random = Math.random() * totalProbability;
    let cumulativeProbability = 0;
    for (let i = 0; i < reachableNodes.length; i++) {
      cumulativeProbability += attractiveness[i];
      if (random <= cumulativeProbability) {
        return reachableNodes[i];
      }
    }
    return reachableNodes[reachableNodes.length - 1];
  }

  /**
   * Update pheromones based on agent tours
   *
   * Update formula:
   * τ(i,j) = (1-ρ) * τ(i,j) + Δτ(i,j)
   *
   * where:
   * - ρ - evaporation rate
   * - Δτ(i,j) = Q / L(k) for each ant k that traveled edge (i,j)
   * - Q - constant
   * - L(k) - tour length of ant k
   * @param bestAgent
   */
  private _updatePheromones(bestAgent: Agent | null): void {
    this._graph.evaporatePheromones(this._params.evaporationRate);

    for (const agent of this._agents) {
      const pheromoneDeposit = this._params.Q / agent.tourLength;

      for (let i = 0; i < agent.tour.length - 1; i++) {
        const from = agent.tour[i];
        const to = agent.tour[i + 1];

        const currentPheromone = this._graph.getPheromone(from, to);
        this._graph.updatePheromone(from, to, currentPheromone + pheromoneDeposit);
      }
    }

    if (bestAgent && this._params.elitistCount) {
      const elitistPheromone = (this._params.Q * this._params.elitistCount) / bestAgent.tourLength;

      for (let i = 0; i < bestAgent.tour.length - 1; i++) {
        const from = bestAgent.tour[i];
        const to = bestAgent.tour[i + 1];

        const currentPheromone = this._graph.getPheromone(from, to);
        this._graph.updatePheromone(from, to, currentPheromone + elitistPheromone);
      }
    }
  }

  private *_createIterationGenerator(): Generator<AlgorithmIterationResult, void> {
    let currentIteration = 0;
    let noImprovementCount = 0;

    while (currentIteration < this._params.maxIterations && !this._stopped) {
      currentIteration++;

      const iterationResult = this._executeIteration(currentIteration);
      const globalBestLength = this._bestAgent?.tourLength ?? Infinity;
      if (iterationResult.bestLength < globalBestLength) {
        noImprovementCount = 0;
      } else {
        noImprovementCount++;
      }
      iterationResult.converged = noImprovementCount >= this._params.improvementThreshold;
      yield iterationResult;

      const reachedIterationLimit = currentIteration >= this._params.maxIterations;
      if (this._stopped || iterationResult.converged || reachedIterationLimit) {
        break;
      }
      this._resetAgents();
    }
    this._status$.next(AlgorithmStatus.Stopped);
  }

  private _executeIteration(iteration: number): AlgorithmIterationResult {
    for (let step = 0; step < this._graph.nodes.length - 1; step++) {
      this._moveAgents();
    }
    for (const agent of this._agents) {
      agent.closeTour();
      agent.tourLength = this._graph.calculateDistance(agent.tour);
    }
    const iterationBestAgent = this._findBestAgent();
    if (!this._bestAgent || iterationBestAgent.tourLength < this._bestAgent.tourLength) {
      this._bestAgent = new Agent(iterationBestAgent);
    }
    const totalLength = this._agents.reduce((sum, agent) => sum + agent.tourLength, 0);
    const averageLength = totalLength / this._agents.length;
    this._updatePheromones(this._bestAgent);
    return {
      iteration,
      bestTour: [...this._bestAgent.tour],
      bestLength: this._bestAgent.tourLength,
      averageLength,
      converged: false,
    };
  }

  private _findBestAgent(): Agent {
    let bestAgent = this._agents[0];
    for (const agent of this._agents) {
      if (agent.tourLength === Infinity) {
        continue;
      }
      if (bestAgent.tourLength === Infinity) {
        bestAgent = agent;
        continue;
      }
      if (agent.tourLength < bestAgent.tourLength) {
        bestAgent = agent;
      }
    }
    return bestAgent;
  }

  private _moveAgents(): void {
    for (const agent of this._agents) {
      if (agent.visitedNodesCount !== this._graph.nodes.length) {
        const nextNode = this._selectNextNode(agent);
        agent.moveTo(nextNode);
      }
    }
  }

  private _resetAgents(): void {
    for (let i = 0; i < this._agents.length; i++) {
      const startPosition = i % this._graph.nodes.length;
      this._agents[i].reset(startPosition);
    }
  }

  public start(graph: Graph, params: AlgorithmParams): Generator<AlgorithmIterationResult, void> {
    this._initialize(graph, params);
    this._status$.next(AlgorithmStatus.Running);
    return this._createIterationGenerator();
  }

  public stop(): void {
    if (!this._stopped) {
      this._status$.next(AlgorithmStatus.Stopped);
    }
  }
}
