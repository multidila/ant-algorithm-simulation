/**
 * Component for algorithm parameters configuration
 */

import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';

import { AlgorithmParams } from '../../models/algorithm';

@Component({
  selector: 'app-algorithm-params',
  standalone: true,
  imports: [CommonModule, FormsModule, MatExpansionModule],
  templateUrl: './algorithm-params.component.html',
  styleUrl: './algorithm-params.component.scss',
})
export class AlgorithmParamsComponent {
  protected readonly hasParams = computed(() => this.params() != null);

  public readonly params = input<AlgorithmParams | null>(null);
  public readonly disabled = input(false);

  public readonly paramsReset = output<void>();
  public readonly paramsChange = output<AlgorithmParams | null>();

  protected onParamValueChange<K extends keyof AlgorithmParams>(
    key: K,
    value: AlgorithmParams[K]
  ): void {
    const current = this.params();
    if (!current) {
      return;
    }
    this.paramsChange.emit({ ...current, [key]: value });
  }
}
