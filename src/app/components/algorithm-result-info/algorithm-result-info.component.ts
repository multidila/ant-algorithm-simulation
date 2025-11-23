import { CommonModule } from '@angular/common';
import { Component, computed, input, Signal } from '@angular/core';

import { AlgorithmIterationResult } from '../../models/algorithm';

@Component({
  selector: 'app-algorithm-result-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './algorithm-result-info.component.html',
  styleUrl: './algorithm-result-info.component.scss',
})
export class AlgorithmResultInfoComponent {
  protected readonly iterationCount: Signal<number> = computed(() => this.iterations().length);
  protected readonly finalIteration: Signal<AlgorithmIterationResult | null> = computed(() => {
    const list = this.iterations();
    if (!list.length) {
      return null;
    }
    return list[list.length - 1];
  });
  protected readonly currentIteration: Signal<AlgorithmIterationResult | null> = computed(() => {
    const iterationNumber = this.iteration();
    if (iterationNumber == null) {
      return null;
    }
    return this.iterations().find((iter) => iter.iteration === iterationNumber) ?? null;
  });

  public readonly iteration = input<number | null>(null);
  public readonly iterations = input.required<ReadonlyArray<AlgorithmIterationResult>>();
  public readonly convergenceIteration = input<number | null>(null);
}
