export interface AlgorithmParams {
  alpha: number;                // Pheromone influence
  beta: number;                 // Distance influence
  evaporationRate: number;      // Evaporation rate
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Q: number;                    // Pheromone constant
  antCount: number;             // Number of ants
  maxIterations: number;        // Maximum number of iterations
  elitistCount?: number;        // Number of elitist ants
  improvementThreshold: number; // Iterations without improvement to stop
  initialPheromone: number;     // Initial pheromone level
}
