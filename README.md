# ant-algorithm-simulation

A simulation of the Ant Colony Optimization (ACO) algorithm designed to solve the Traveling Salesman Problem (TSP). The project showcases how ant-like agents form pheromone trails, cooperate, and search for the shortest paths. It includes an interactive visual representation of the algorithm in action.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.7.

## Features

- **Interactive Visualization**: Real-time graph visualization showing pheromone trails and best tour
- **Seeded Random Generation**: Reproducible scenarios using seed values for testing and demonstration
- **Configurable Parameters**: Adjust algorithm parameters (α, β, ρ, Q, ant count, iterations)
- **K-Regular Graph Generation**: Generate graphs with configurable node count and edge density
- **Integration Tests**: Comprehensive test suite validating algorithm behavior across different scenarios

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running tests

This project uses [Jest](https://jestjs.io/) for testing. To execute all tests, run:

```bash
npm test
```

To run tests in watch mode:

```bash
npm run test:watch
```

To run only integration tests:

```bash
npm run test:integration
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
