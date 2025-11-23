export interface AlgorithmIterationResult {
  iteration: number;
  bestTour: number[];
  bestLength: number;
  averageLength: number;
  converged: boolean;
}
