import { AntColonyOptimization } from './ant-colony-optimization.service';
import { AlgorithmIterationResult, AlgorithmParams } from '../../models/algorithm';
import { Graph, GraphParams } from '../../models/graph';
import { RandomService } from '../random';

interface AlgorithmTestResult {
  scenario: string;
  graphParams: GraphParams;
  algorithmParams: AlgorithmParams;
  iterations: AlgorithmIterationResult[];
  finalBestLength: number;
  convergenceIteration: number | null;
  totalIterations: number;
  executionTimeMs: number;
}

function runAlgorithmToCompletion(
  graph: Graph,
  params: AlgorithmParams,
  randomService: RandomService
): AlgorithmIterationResult[] {
  const algorithm = new AntColonyOptimization(randomService);
  const generator = algorithm.start(graph, params);

  const results: AlgorithmIterationResult[] = [];
  let step = generator.next();

  while (!step.done) {
    results.push(step.value);
    step = generator.next();
  }

  return results;
}

function runScenario(
  scenarioName: string,
  graphParams: GraphParams,
  algorithmParams: AlgorithmParams
): AlgorithmTestResult {
  const startTime = performance.now();

  const randomService = new RandomService();
  if (graphParams.seed !== undefined) {
    randomService.setSeed(graphParams.seed);
  }

  const graph = new Graph(
    {
      ...graphParams,
      initialPheromone: algorithmParams.initialPheromone,
    },
    randomService
  );

  const iterations = runAlgorithmToCompletion(graph, algorithmParams, randomService);
  const executionTimeMs = performance.now() - startTime;

  const convergenceEntry = iterations.find((iter) => iter.converged);
  const lastIteration = iterations[iterations.length - 1];

  return {
    scenario: scenarioName,
    graphParams,
    algorithmParams,
    iterations,
    finalBestLength: lastIteration?.bestLength ?? Infinity,
    convergenceIteration: convergenceEntry ? convergenceEntry.iteration : null,
    totalIterations: iterations.length,
    executionTimeMs,
  };
}

describe('AntColonyOptimization Integration Tests', () => {
  const BASE_ALGORITHM_PARAMS: AlgorithmParams = {
    antCount: 10,
    maxIterations: 100,
    alpha: 1.0,
    beta: 5.0,
    evaporationRate: 0.5,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Q: 100,
    elitistCount: 5,
    improvementThreshold: 10,
    initialPheromone: 0.1,
  };

  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterAll(() => {
    jest.spyOn(console, 'warn').mockRestore();
  });

  describe('Complete Graph Scenarios', () => {
    it('should solve small complete graph (10 nodes)', () => {
      const graphParams: GraphParams = {
        count: 10,
        seed: 12345,
      };

      const result = runScenario('Small Complete Graph', graphParams, BASE_ALGORITHM_PARAMS);

      expect(result.iterations.length).toBeGreaterThan(0);
      expect(result.finalBestLength).not.toBe(Infinity);
      expect(result.finalBestLength).toBeGreaterThan(0);

      // eslint-disable-next-line no-console
      console.log(
        `[${result.scenario}] Best: ${result.finalBestLength.toFixed(2)}, ` +
          `Converged at: ${result.convergenceIteration ?? 'N/A'}, ` +
          `Time: ${result.executionTimeMs.toFixed(2)}ms`
      );
    });

    it('should solve medium complete graph (20 nodes)', () => {
      const graphParams: GraphParams = {
        count: 20,
        seed: 54321,
      };

      const result = runScenario('Medium Complete Graph', graphParams, BASE_ALGORITHM_PARAMS);

      expect(result.iterations.length).toBeGreaterThan(0);
      expect(result.finalBestLength).not.toBe(Infinity);

      // eslint-disable-next-line no-console
      console.log(
        `[${result.scenario}] Best: ${result.finalBestLength.toFixed(2)}, ` +
          `Converged at: ${result.convergenceIteration ?? 'N/A'}, ` +
          `Time: ${result.executionTimeMs.toFixed(2)}ms`
      );
    });
  });

  describe('K-Regular Graph Scenarios', () => {
    it('should handle sparse k-regular graph (20 nodes, 4 edges per node)', () => {
      const graphParams: GraphParams = {
        count: 20,
        edgesPerNode: 4,
        seed: 11111,
      };

      const result = runScenario('Sparse K-Regular Graph', graphParams, BASE_ALGORITHM_PARAMS);

      expect(result.iterations.length).toBeGreaterThan(0);

      // eslint-disable-next-line no-console
      console.log(
        `[${result.scenario}] Best: ${result.finalBestLength.toFixed(2)}, ` +
          `Converged at: ${result.convergenceIteration ?? 'N/A'}, ` +
          `Time: ${result.executionTimeMs.toFixed(2)}ms`
      );
    });

    it('should handle dense k-regular graph (15 nodes, 8 edges per node)', () => {
      const graphParams: GraphParams = {
        count: 15,
        edgesPerNode: 8,
        seed: 22222,
      };

      const result = runScenario('Dense K-Regular Graph', graphParams, BASE_ALGORITHM_PARAMS);

      expect(result.iterations.length).toBeGreaterThan(0);

      // eslint-disable-next-line no-console
      console.log(
        `[${result.scenario}] Best: ${result.finalBestLength.toFixed(2)}, ` +
          `Converged at: ${result.convergenceIteration ?? 'N/A'}, ` +
          `Time: ${result.executionTimeMs.toFixed(2)}ms`
      );
    });
  });

  describe('Parameter Variations', () => {
    it('should test high pheromone influence (alpha=2.0)', () => {
      const graphParams: GraphParams = {
        count: 15,
        seed: 33333,
      };

      const params: AlgorithmParams = {
        ...BASE_ALGORITHM_PARAMS,
        alpha: 2.0,
      };

      const result = runScenario('High Pheromone Influence', graphParams, params);

      expect(result.iterations.length).toBeGreaterThan(0);
      expect(result.finalBestLength).not.toBe(Infinity);

      // eslint-disable-next-line no-console
      console.log(
        `[${result.scenario}] Best: ${result.finalBestLength.toFixed(2)}, ` +
          `Converged at: ${result.convergenceIteration ?? 'N/A'}, ` +
          `Time: ${result.executionTimeMs.toFixed(2)}ms`
      );
    });

    it('should test high distance influence (beta=10.0)', () => {
      const graphParams: GraphParams = {
        count: 15,
        seed: 44444,
      };

      const params: AlgorithmParams = {
        ...BASE_ALGORITHM_PARAMS,
        beta: 10.0,
      };

      const result = runScenario('High Distance Influence', graphParams, params);

      expect(result.iterations.length).toBeGreaterThan(0);
      expect(result.finalBestLength).not.toBe(Infinity);

      // eslint-disable-next-line no-console
      console.log(
        `[${result.scenario}] Best: ${result.finalBestLength.toFixed(2)}, ` +
          `Converged at: ${result.convergenceIteration ?? 'N/A'}, ` +
          `Time: ${result.executionTimeMs.toFixed(2)}ms`
      );
    });

    it('should test low evaporation rate (0.1)', () => {
      const graphParams: GraphParams = {
        count: 15,
        seed: 55555,
      };

      const params: AlgorithmParams = {
        ...BASE_ALGORITHM_PARAMS,
        evaporationRate: 0.1,
      };

      const result = runScenario('Low Evaporation Rate', graphParams, params);

      expect(result.iterations.length).toBeGreaterThan(0);
      expect(result.finalBestLength).not.toBe(Infinity);

      // eslint-disable-next-line no-console
      console.log(
        `[${result.scenario}] Best: ${result.finalBestLength.toFixed(2)}, ` +
          `Converged at: ${result.convergenceIteration ?? 'N/A'}, ` +
          `Time: ${result.executionTimeMs.toFixed(2)}ms`
      );
    });

    it('should test high evaporation rate (0.9)', () => {
      const graphParams: GraphParams = {
        count: 15,
        seed: 66666,
      };

      const params: AlgorithmParams = {
        ...BASE_ALGORITHM_PARAMS,
        evaporationRate: 0.9,
      };

      const result = runScenario('High Evaporation Rate', graphParams, params);

      expect(result.iterations.length).toBeGreaterThan(0);
      expect(result.finalBestLength).not.toBe(Infinity);

      // eslint-disable-next-line no-console
      console.log(
        `[${result.scenario}] Best: ${result.finalBestLength.toFixed(2)}, ` +
          `Converged at: ${result.convergenceIteration ?? 'N/A'}, ` +
          `Time: ${result.executionTimeMs.toFixed(2)}ms`
      );
    });

    it('should test many ants (antCount=50)', () => {
      const graphParams: GraphParams = {
        count: 15,
        seed: 77777,
      };

      const params: AlgorithmParams = {
        ...BASE_ALGORITHM_PARAMS,
        antCount: 50,
      };

      const result = runScenario('Many Ants', graphParams, params);

      expect(result.iterations.length).toBeGreaterThan(0);
      expect(result.finalBestLength).not.toBe(Infinity);

      // eslint-disable-next-line no-console
      console.log(
        `[${result.scenario}] Best: ${result.finalBestLength.toFixed(2)}, ` +
          `Converged at: ${result.convergenceIteration ?? 'N/A'}, ` +
          `Time: ${result.executionTimeMs.toFixed(2)}ms`
      );
    });
  });

  describe('Reproducibility Tests', () => {
    it('should produce identical results with same seed', () => {
      const graphParams: GraphParams = {
        count: 10,
        seed: 99999,
      };

      const result1 = runScenario('Seed Test 1', graphParams, BASE_ALGORITHM_PARAMS);
      const result2 = runScenario('Seed Test 2', graphParams, BASE_ALGORITHM_PARAMS);

      expect(result1.finalBestLength).toBe(result2.finalBestLength);
      expect(result1.totalIterations).toBe(result2.totalIterations);
      expect(result1.convergenceIteration).toBe(result2.convergenceIteration);

      // Verify all iteration results are identical
      expect(result1.iterations.length).toBe(result2.iterations.length);
      for (let i = 0; i < result1.iterations.length; i++) {
        expect(result1.iterations[i].bestLength).toBe(result2.iterations[i].bestLength);
        expect(result1.iterations[i].averageLength).toBe(result2.iterations[i].averageLength);
        expect(result1.iterations[i].bestTour).toEqual(result2.iterations[i].bestTour);
      }

      // eslint-disable-next-line no-console
      console.log(
        '[Reproducibility Test] Both runs produced identical results: ' +
          `Best=${result1.finalBestLength.toFixed(2)}`
      );
    });
  });
});
