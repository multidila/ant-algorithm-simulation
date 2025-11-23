import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { interval, Subject, Subscription, takeUntil } from 'rxjs';

import {
  AlgorithmControlComponent,
  AlgorithmParamsComponent,
  AlgorithmResultInfoComponent,
  AlgorithmResultsTableComponent,
  GraphNodesInfoComponent,
  GraphParamsComponent,
  GraphVisualizationComponent,
} from './components';
import { AlgorithmStatus } from './enums';
import { AlgorithmIterationResult, AlgorithmParams } from './models/algorithm';
import { Graph, GraphParams } from './models/graph';
import { AntColonyOptimization } from './services/algorithm';

const DEFAULT_ALGORITHM_PARAMS: AlgorithmParams = {
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

const DEFAULT_GRAPH_PARAMS: GraphParams = {
  count: 10,
  maxEdgesPerNode: undefined,
  minDistance: undefined,
  maxDistance: undefined,
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatTabsModule,
    GraphVisualizationComponent,
    AlgorithmControlComponent,
    GraphParamsComponent,
    AlgorithmParamsComponent,
    GraphNodesInfoComponent,
    AlgorithmResultInfoComponent,
    AlgorithmResultsTableComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly _destroy$ = new Subject<void>();
  private readonly _algorithm = inject(AntColonyOptimization);
  private _algorithmLoopSub?: Subscription;
  private _algorithmIterator?: Generator<AlgorithmIterationResult, void>;

  protected readonly status = signal<AlgorithmStatus>(AlgorithmStatus.Stopped);
  protected readonly statuses = AlgorithmStatus;
  protected readonly graph = signal<Graph | null>(null);
  protected readonly graphParams = signal<GraphParams>({ ...DEFAULT_GRAPH_PARAMS });
  protected readonly algorithmParams = signal<AlgorithmParams>({ ...DEFAULT_ALGORITHM_PARAMS });
  protected readonly iteration = signal<AlgorithmIterationResult | null>(null);
  protected readonly iterations = signal<ReadonlyArray<AlgorithmIterationResult>>([]);

  protected readonly nodes = computed(() => this.graph()?.nodes ?? []);
  protected readonly convergenceIteration = computed(() => {
    const entry = this.iterations().find((iter) => iter.converged);
    return entry ? entry.iteration : null;
  });

  private _initializeGraph(): void {
    const graphParamsValue = this.graphParams();
    const algorithmParamsValue = this.algorithmParams();
    this.graph.set(
      new Graph({
        ...graphParamsValue,
        initialPheromone: algorithmParamsValue.initialPheromone,
      })
    );
    this.iterations.set([]);
    this.iteration.set(null);
  }

  private _startAlgorithmLoop(graph: Graph): void {
    this._algorithmIterator = this._algorithm.start(graph, this.algorithmParams());
    this.iterations.set([]);
    this.iteration.set(null);

    this._algorithmLoopSub = interval(200)
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        if (this.status() !== AlgorithmStatus.Running) {
          return;
        }
        if (!this._algorithmIterator) {
          return;
        }
        const step = this._algorithmIterator.next();
        if (step.done) {
          this.onStop();
          return;
        }
        this.iteration.set(step.value);
        this.iterations.update((history) => [...history, step.value]);
      });
  }

  private _stopAlgorithmLoop(): void {
    this._algorithmLoopSub?.unsubscribe();
    this._algorithmLoopSub = undefined;
    this._algorithmIterator = undefined;
  }

  protected onStart(): void {
    const graph = this.graph();
    if (!graph) {
      return;
    }
    this._stopAlgorithmLoop();
    this._startAlgorithmLoop(graph);
  }

  protected onStop(): void {
    this._stopAlgorithmLoop();
    this._algorithm.stop();
  }

  protected onGraphParamsChange(params: GraphParams | null): void {
    if (!params) {
      return;
    }
    this.graphParams.set({ ...params });
    this.iterations.set([]);
    this.iteration.set(null);
    this._initializeGraph();
  }

  protected onGraphParamsReset(): void {
    this.onGraphParamsChange({ ...DEFAULT_GRAPH_PARAMS });
  }

  protected onAlgorithmParamsChange(params: AlgorithmParams | null): void {
    if (!params) {
      return;
    }
    this.algorithmParams.set({ ...params });
    this.iterations.set([]);
    this.iteration.set(null);
  }

  protected onAlgorithmParamsReset(): void {
    this.onAlgorithmParamsChange({ ...DEFAULT_ALGORITHM_PARAMS });
  }

  public ngOnInit(): void {
    this._algorithm.status$.pipe(takeUntil(this._destroy$)).subscribe((status) => {
      this.status.set(status);
    });
    this._initializeGraph();
  }

  public ngOnDestroy(): void {
    this._stopAlgorithmLoop();
    this._destroy$.next();
    this._destroy$.complete();
  }
}
