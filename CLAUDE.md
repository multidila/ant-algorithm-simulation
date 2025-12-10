# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An Angular application simulating Ant Colony Optimization (ACO) algorithm for solving optimization problems (e.g., Traveling Salesman Problem). The simulation visualizes agents forming pheromone trails and searching for shortest paths through graphs.

## Development Commands

```bash
# Development server (http://localhost:4200)
ng serve

# Build for production
ng build

# Run unit tests (Karma/Jasmine)
ng test

# Lint code
npm run lint

# Lint and auto-fix
npm run lint:fix

# Watch mode for continuous builds
npm run watch
```

## Architecture Overview

### Core Algorithm Flow

1. **Graph Generation** ([graph.model.ts](src/app/models/graph/graph.model.ts))
   - Nodes are randomly positioned with coordinates for visualization
   - Supports k-regular graphs (each node has approximately k edges via `edgesPerNode`)
   - Ring + chords topology ensures connectivity (requires k ≥ 2)
   - Edge weights can be euclidean distances or random values (if min/max distance specified)
   - Distance and pheromone matrices are maintained

2. **ACO Algorithm** ([ant-colony-optimization.service.ts](src/app/services/algorithm/ant-colony-optimization.service.ts))
   - Uses generator pattern to yield iteration results
   - Runs via interval subscription in main component (200ms per iteration)
   - Agent movement based on pheromone/distance attractiveness formula: `(pheromone^alpha) * (visibility^beta)`
   - Pheromone update formula: `τ(i,j) = (1-ρ) * τ(i,j) + Δτ(i,j)`
   - Supports elitist ant strategy (best agent gets additional pheromone deposits)

3. **Visualization** ([graph-visualization.component.ts](src/app/components/graph-visualization/graph-visualization.component.ts))
   - Uses vis-network library for interactive graph rendering
   - Edge thickness/opacity represents pheromone levels (normalized)
   - Best tour highlighted in red (#f56565)
   - Nodes are fixed position; physics disabled

### Key Data Models

- **Agent** ([agent.model.ts](src/app/models/algorithm/agent.model.ts)): Maintains tour, tabu list, position, and tour length
- **AlgorithmParams**: α (pheromone influence), β (distance influence), ρ (evaporation rate), Q (pheromone constant), ant count, iterations
- **GraphParams**: node count, edgesPerNode (k-regular, k ≥ 2), minDistance, maxDistance

### State Management Pattern

- Uses Angular signals for reactive state ([app.ts](src/app/app.ts:67-74))
- RxJS BehaviorSubject for algorithm status
- Generator pattern for algorithm execution (allows pause/resume capability)

## Implementation Guidelines

### Adding New Algorithm Features

- Modify [AntColonyOptimization](src/app/services/algorithm/ant-colony-optimization.service.ts) service
- Update [AlgorithmParams](src/app/models/algorithm/algorithm-params.model.ts) interface if new parameters needed
- Ensure pheromone update logic maintains symmetry (`pheromones[i][j] === pheromones[j][i]`)

### Graph Modifications

- Distance matrix uses `Infinity` to represent non-existent edges
- K-regular graphs use ring + chords topology for guaranteed connectivity
- Edge weights: euclidean distances (default) or random values in [minDistance, maxDistance] range
- All distance/pheromone operations should preserve matrix symmetry

### Component Structure

- Components use standalone mode (Angular 20+)
- Each component folder has index.ts barrel export
- Visualization components use Angular signals with `effect()` for reactivity

## Technical Notes

- **TypeScript**: Strict mode enabled with Angular compiler strictness
- **Linting**: ESLint with max warnings set to 0 (zero tolerance)
- **Styling**: SCSS with Prettier (printWidth: 100, singleQuote: true)
- **Dependencies**: Angular Material for UI, Chart.js for result charts, vis-network for graph visualization
- **Testing**: Jasmine/Karma (run individual test: modify spec file and use `ng test` with focused test)
