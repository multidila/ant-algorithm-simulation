/**
 * Component for displaying all iterations results in a table
 */

import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { AlgorithmIterationResult } from '../../models/algorithm';

@Component({
  selector: 'app-algorithm-results-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './algorithm-results-table.component.html',
  styleUrl: './algorithm-results-table.component.scss',
})
export class AlgorithmResultsTableComponent {
  protected readonly hasIterations = computed(() => this.iterations().length > 0);

  public readonly iterations = input<ReadonlyArray<AlgorithmIterationResult>>([]);
  public readonly convergenceIteration = input<number | null>(null);
}
